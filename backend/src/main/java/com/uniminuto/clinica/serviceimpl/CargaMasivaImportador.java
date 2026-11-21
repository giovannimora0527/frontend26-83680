package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.CargaMasiva;
import com.uniminuto.clinica.entity.CargaMasivaDetalle;
import com.uniminuto.clinica.entity.Impuesto;
import com.uniminuto.clinica.entity.LoteMedicamento;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.repository.CargaMasivaDetalleRepository;
import com.uniminuto.clinica.repository.CargaMasivaRepository;
import com.uniminuto.clinica.repository.ImpuestoRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.repository.UsuarioRepository;
import com.uniminuto.clinica.utils.Constantes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

/**
 * Importa cada fila en una transacción independiente (REQUIRES_NEW): un error en
 * una fila no revierte ni deja inconsistentes las demás.
 */
@Component
public class CargaMasivaImportador {

    @Autowired
    private CargaMasivaRepository cargaRepository;

    @Autowired
    private CargaMasivaDetalleRepository detalleRepository;

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    @Autowired
    private ImpuestoRepository impuestoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private InventarioMotor inventarioMotor;

    /** Marca la carga como confirmada (bloqueo para evitar doble confirmación). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void iniciar(Long cargaId, Integer usuarioId) {
        CargaMasiva carga = cargaRepository.bloquear(cargaId)
                .orElseThrow(() -> new NotFoundException("La carga masiva no existe."));
        if (!Constantes.CARGA_PREVISUALIZADA.equals(carga.getEstado())) {
            throw new ConflictException("La carga ya fue " + carga.getEstado().toLowerCase() + "; no se puede confirmar de nuevo.");
        }
        if (carga.getRegistrosValidos() == 0) {
            throw new ConflictException("La carga no tiene registros válidos para importar.");
        }
        carga.setEstado(Constantes.CARGA_CONFIRMADA);
        carga.setUsuarioConfirma(usuarioRepository.findById(usuarioId).orElse(null));
        carga.setFechaConfirmacion(LocalDateTime.now());
        cargaRepository.save(carga);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void importarFila(Long cargaId, Long detalleId, Integer usuarioId) {
        CargaMasivaDetalle d = detalleRepository.bloquear(detalleId)
                .orElseThrow(() -> new NotFoundException("Fila de carga inexistente."));
        if (!Constantes.FILA_VALIDA.equals(d.getEstado())) {
            return; // ya procesada: no se importa dos veces
        }
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario inexistente."));
        Map<String, String> v = CargaMasivaFormato.deserializar(d.getDatos());
        String codigo = v.get("codigo").trim().toUpperCase();
        String nombre = v.get("nombre").trim();

        Medicamento m;
        Optional<Medicamento> porCodigo = medicamentoRepository.findByCodigoIgnoreCase(codigo);
        if (porCodigo.isPresent()) {
            m = porCodigo.get();
            if (!m.getNombre().equalsIgnoreCase(nombre)) {
                throw new ConflictException("El código " + codigo + " ya pertenece a '" + m.getNombre() + "'.");
            }
            if (!Boolean.TRUE.equals(m.getActivo())) {
                throw new ConflictException("El producto " + codigo + " está inactivo.");
            }
        } else {
            if (medicamentoRepository.findByNombreIgnoreCase(nombre).isPresent()) {
                throw new ConflictException("Ya existe un producto llamado '" + nombre + "' con otro código.");
            }
            Impuesto imp = impuestoRepository.findByCodigoIgnoreCase(v.get("impuesto").trim())
                    .orElseThrow(() -> new NotFoundException("Impuesto inexistente: " + v.get("impuesto")));
            String tipo = v.get("tipo_producto").trim().toUpperCase();
            m = new Medicamento();
            m.setCodigo(codigo);
            m.setNombre(nombre);
            m.setDescripcion(vacioANull(v.get("descripcion")));
            m.setPresentacion(vacioANull(v.get("presentacion")));
            m.setTipoProducto(tipo);
            m.setRequiereInvima(Constantes.PRODUCTO_MEDICAMENTO.equals(tipo));
            m.setRegistroInvima(vacioANull(v.get("registro_invima")));
            String unidad = vacioANull(v.get("unidad_medida"));
            m.setUnidadMedida(unidad == null ? "UNIDAD" : unidad.toUpperCase());
            m.setPrecioCompra(CargaMasivaFormato.decimal(v.get("precio_compra")));
            m.setPrecioVenta(CargaMasivaFormato.decimal(v.get("precio_venta")));
            m.setImpuesto(imp);
            Integer minimo = CargaMasivaFormato.entero(v.get("stock_minimo"));
            m.setStockMinimo(minimo == null ? 0 : minimo);
            m.setFechaProximoPedido(CargaMasivaFormato.fecha(v.get("fecha_proximo_pedido")));
            m.setStockActual(0);
            m.setActivo(Boolean.TRUE);
            m.setFechaCreacionRegistro(LocalDateTime.now());
            medicamentoRepository.save(m);
        }
        LoteMedicamento lote = new LoteMedicamento();
        lote.setNumeroLote(v.get("numero_lote").trim().toUpperCase());
        lote.setFechaCompra(CargaMasivaFormato.fecha(v.get("fecha_compra")));
        lote.setFechaIngreso(LocalDate.now());
        lote.setFechaVencimiento(CargaMasivaFormato.fecha(v.get("fecha_vencimiento")));
        lote.setPrecioCompra(CargaMasivaFormato.decimal(v.get("precio_compra")));
        lote.setCantidadInicial(CargaMasivaFormato.entero(v.get("cantidad")));
        inventarioMotor.ingresarLote(m, lote, usuario, new InventarioMotor.Referencia(Constantes.CONCEPTO_CARGA_MASIVA,
                null, null, null, cargaId, "Carga masiva #" + cargaId + " - fila " + d.getFila()));
        d.setEstado(Constantes.FILA_IMPORTADA);
        d.setMedicamentoId(m.getId());
        d.setLoteId(lote.getId());
        detalleRepository.save(d);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void marcarFallida(Long detalleId, String motivo) {
        detalleRepository.findById(detalleId).ifPresent(d -> {
            d.setEstado(Constantes.FILA_FALLIDA);
            String previo = d.getErrores() == null ? "" : d.getErrores() + CargaMasivaFormato.SEPARADOR_ERRORES;
            d.setErrores(previo + "Error al importar: " + motivo);
            detalleRepository.save(d);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finalizar(Long cargaId) {
        CargaMasiva carga = cargaRepository.findById(cargaId).orElseThrow();
        long importados = detalleRepository.countByCargaIdAndEstado(cargaId, Constantes.FILA_IMPORTADA);
        long errores = detalleRepository.countByCargaIdAndEstado(cargaId, Constantes.FILA_ERROR)
                + detalleRepository.countByCargaIdAndEstado(cargaId, Constantes.FILA_FALLIDA);
        carga.setRegistrosImportados((int) importados);
        carga.setRegistrosError((int) errores);
        cargaRepository.save(carga);
    }

    private static String vacioANull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
