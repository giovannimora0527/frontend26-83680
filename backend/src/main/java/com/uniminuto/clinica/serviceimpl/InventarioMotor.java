package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.LoteMedicamento;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.entity.MovimientoInventario;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.repository.LoteMedicamentoRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.repository.MovimientoInventarioRepository;
import com.uniminuto.clinica.utils.Constantes;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * Único punto que modifica existencias. Todas las operaciones exigen una
 * transacción activa (Propagation.MANDATORY), bloquean el medicamento y el lote
 * (SELECT ... FOR UPDATE) y registran el movimiento con saldo anterior y nuevo.
 * Nunca permite saldos negativos.
 */
@Component
public class InventarioMotor {

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    @Autowired
    private LoteMedicamentoRepository loteRepository;

    @Autowired
    private MovimientoInventarioRepository movimientoRepository;

    @PersistenceContext
    private EntityManager entityManager;

    /** Datos de referencia del movimiento. */
    public record Referencia(String concepto, Long formulaId, Long despachoId, Long despachoDetalleId,
                             Long cargaId, String observacion) {
    }

    /**
     * Crea un lote nuevo con su cantidad inicial y registra la ENTRADA.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public LoteMedicamento ingresarLote(Medicamento medicamento, LoteMedicamento lote, Usuario usuario, Referencia ref) {
        Medicamento med = bloquearMedicamento(medicamento.getId());
        if (loteRepository.existsByMedicamento_IdAndNumeroLoteIgnoreCase(med.getId(), lote.getNumeroLote())) {
            throw new ConflictException("El lote " + lote.getNumeroLote() + " ya está registrado para " + med.getNombre() + ".");
        }
        lote.setMedicamento(med);
        lote.setCantidadDisponible(lote.getCantidadInicial());
        lote.setActivo(Boolean.TRUE);
        lote.setUsuarioId(usuario.getUsuarioId());
        lote.setFechaCreacion(LocalDateTime.now());
        loteRepository.save(lote);

        int saldoAnterior = med.getStockActual();
        registrarMovimiento(med, lote, Constantes.MOV_ENTRADA, lote.getCantidadInicial(), saldoAnterior,
                saldoAnterior + lote.getCantidadInicial(), lote.getPrecioCompra(), usuario, ref);

        med.setPrecioCompra(lote.getPrecioCompra());
        if (med.getFechaCompra() == null || lote.getFechaCompra().isAfter(med.getFechaCompra())) {
            med.setFechaCompra(lote.getFechaCompra());
        }
        if (med.getFechaIngreso() == null) {
            med.setFechaIngreso(lote.getFechaIngreso());
        }
        recalcular(med);
        return lote;
    }

    /**
     * Descuenta unidades de un lote (SALIDA). Valida vencimiento y existencias.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public MovimientoInventario salidaLote(Long loteId, int cantidad, Usuario usuario, Referencia ref) {
        // Orden de bloqueo fijo: medicamento -> lote (evita interbloqueos)
        Medicamento med = bloquearMedicamento(medicamentoDeLote(loteId));
        LoteMedicamento lote = bloquearLote(loteId);
        if (cantidad <= 0) {
            throw new ConflictException("La cantidad a descontar debe ser mayor a cero.");
        }
        if (!Boolean.TRUE.equals(lote.getActivo())) {
            throw new ConflictException("El lote " + lote.getNumeroLote() + " está inactivo.");
        }
        if (lote.estaVencido(LocalDate.now())) {
            throw new ConflictException("No se puede dispensar el lote " + lote.getNumeroLote() + " de "
                    + med.getNombre() + ": está vencido (" + lote.getFechaVencimiento() + ").");
        }
        if (lote.getCantidadDisponible() < cantidad) {
            throw new ConflictException("Existencias insuficientes en el lote " + lote.getNumeroLote() + " de "
                    + med.getNombre() + ": disponible " + lote.getCantidadDisponible() + ", solicitado " + cantidad + ".");
        }
        int saldoAnterior = med.getStockActual();
        if (saldoAnterior - cantidad < 0) {
            throw new ConflictException("La operación dejaría el inventario de " + med.getNombre() + " en negativo.");
        }
        lote.setCantidadDisponible(lote.getCantidadDisponible() - cantidad);
        loteRepository.save(lote);
        MovimientoInventario mov = registrarMovimiento(med, lote, Constantes.MOV_SALIDA, cantidad, saldoAnterior,
                saldoAnterior - cantidad, lote.getPrecioCompra(), usuario, ref);
        recalcular(med);
        return mov;
    }

    /**
     * Devuelve unidades a un lote existente (ENTRADA por reversión de una dispensación).
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public MovimientoInventario reingresoLote(Long loteId, int cantidad, Usuario usuario, Referencia ref) {
        // Orden de bloqueo fijo: medicamento -> lote (evita interbloqueos)
        Medicamento med = bloquearMedicamento(medicamentoDeLote(loteId));
        LoteMedicamento lote = bloquearLote(loteId);
        if (lote.getCantidadDisponible() + cantidad > lote.getCantidadInicial()) {
            throw new ConflictException("La reversión supera la cantidad inicial del lote " + lote.getNumeroLote() + ".");
        }
        lote.setCantidadDisponible(lote.getCantidadDisponible() + cantidad);
        loteRepository.save(lote);
        int saldoAnterior = med.getStockActual();
        MovimientoInventario mov = registrarMovimiento(med, lote, Constantes.MOV_ENTRADA, cantidad, saldoAnterior,
                saldoAnterior + cantidad, lote.getPrecioCompra(), usuario, ref);
        recalcular(med);
        return mov;
    }

    /**
     * Escribe cambios pendientes, recarga el registro desde la BD y lo bloquea
     * (SELECT ... FOR UPDATE) para que el saldo sea consistente entre transacciones.
     */
    private Medicamento bloquearMedicamento(Long id) {
        Medicamento med = entityManager.find(Medicamento.class, id);
        if (med == null) {
            throw new NotFoundException("El medicamento " + id + " no existe.");
        }
        entityManager.flush();
        entityManager.refresh(med, LockModeType.PESSIMISTIC_WRITE);
        return med;
    }

    private Long medicamentoDeLote(Long loteId) {
        LoteMedicamento lote = entityManager.find(LoteMedicamento.class, loteId);
        if (lote == null) {
            throw new NotFoundException("El lote " + loteId + " no existe.");
        }
        return lote.getMedicamento().getId();
    }

    private LoteMedicamento bloquearLote(Long id) {
        LoteMedicamento lote = entityManager.find(LoteMedicamento.class, id);
        if (lote == null) {
            throw new NotFoundException("El lote " + id + " no existe.");
        }
        entityManager.flush();
        entityManager.refresh(lote, LockModeType.PESSIMISTIC_WRITE);
        return lote;
    }

    /** Recalcula stock consolidado y vencimiento más próximo desde los lotes. */
    private void recalcular(Medicamento med) {
        List<LoteMedicamento> lotes = loteRepository.conExistenciaFefo(med.getId());
        int total = lotes.stream().mapToInt(LoteMedicamento::getCantidadDisponible).sum();
        med.setStockActual(total);
        med.setFechaVence(lotes.stream().map(LoteMedicamento::getFechaVencimiento).filter(Objects::nonNull)
                .min(Comparator.naturalOrder()).orElse(null));
        med.setFechaModificacionRegistro(LocalDateTime.now());
        medicamentoRepository.save(med);
    }

    private MovimientoInventario registrarMovimiento(Medicamento med, LoteMedicamento lote, String tipo, int cantidad,
                                                     int saldoAnterior, int saldoNuevo, java.math.BigDecimal costo,
                                                     Usuario usuario, Referencia ref) {
        MovimientoInventario m = new MovimientoInventario();
        m.setMedicamento(med);
        m.setLote(lote);
        m.setTipo(tipo);
        m.setConcepto(ref.concepto());
        m.setCantidad(cantidad);
        m.setSaldoAnterior(saldoAnterior);
        m.setSaldoNuevo(saldoNuevo);
        m.setCostoUnitario(costo == null ? java.math.BigDecimal.ZERO : costo);
        m.setFormulaId(ref.formulaId());
        m.setDespachoId(ref.despachoId());
        m.setDespachoDetalleId(ref.despachoDetalleId());
        m.setCargaId(ref.cargaId());
        m.setObservacion(ref.observacion());
        m.setUsuario(usuario);
        m.setFecha(LocalDateTime.now());
        return movimientoRepository.save(m);
    }
}
