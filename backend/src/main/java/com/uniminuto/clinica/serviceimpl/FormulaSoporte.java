package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Despacho;
import com.uniminuto.clinica.entity.EstadoDespacho;
import com.uniminuto.clinica.entity.EstadoEntrega;
import com.uniminuto.clinica.entity.FormulaDetalle;
import com.uniminuto.clinica.entity.FormulaEstadoHistorial;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.LoteMedicamento;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.DespachoDetalleRs;
import com.uniminuto.clinica.models.DespachoRs;
import com.uniminuto.clinica.models.EstadoHistorialRs;
import com.uniminuto.clinica.models.FormulaDetalleRs;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.repository.DespachoDetalleRepository;
import com.uniminuto.clinica.repository.DespachoRepository;
import com.uniminuto.clinica.repository.FormulaEstadoHistorialRepository;
import com.uniminuto.clinica.repository.FormulaRepository;
import com.uniminuto.clinica.repository.LoteMedicamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Operaciones compartidas por los servicios de fórmulas y de despacho:
 * cálculo de unidades entregadas y existencias vigentes, registro del
 * historial de estados y conversión a las respuestas de la API.
 */
@Component
public class FormulaSoporte {

    /**
     * Repositorio de fórmulas.
     */
    @Autowired
    private FormulaRepository formulaRepository;

    /**
     * Repositorio de lotes.
     */
    @Autowired
    private LoteMedicamentoRepository loteRepository;

    /**
     * Repositorio de entregas.
     */
    @Autowired
    private DespachoRepository despachoRepository;

    /**
     * Repositorio de unidades entregadas.
     */
    @Autowired
    private DespachoDetalleRepository despachoDetalleRepository;

    /**
     * Repositorio del historial de estados.
     */
    @Autowired
    private FormulaEstadoHistorialRepository historialRepository;

    /**
     * Busca una fórmula por su identificador.
     *
     * @param formulaId identificador.
     * @return la fórmula.
     */
    public FormulaMedica buscar(Long formulaId) {
        return formulaRepository.findById(formulaId)
                .orElseThrow(() -> new NotFoundException("La fórmula médica no existe"));
    }

    /**
     * Busca una fórmula bloqueándola hasta terminar la transacción.
     *
     * @param formulaId identificador.
     * @return la fórmula.
     */
    public FormulaMedica buscarParaActualizar(Long formulaId) {
        return formulaRepository.buscarParaActualizar(formulaId)
                .orElseThrow(() -> new NotFoundException("La fórmula médica no existe"));
    }

    /**
     * Unidades entregadas por línea, sin contar las entregas revertidas.
     *
     * @param formulaId identificador de la fórmula.
     * @return unidades entregadas por identificador de línea.
     */
    public Map<Long, Integer> entregadas(Long formulaId) {
        Map<Long, Integer> entregadas = new HashMap<>();
        for (Object[] fila : despachoDetalleRepository.sumarEntregadas(formulaId, EstadoEntrega.CONFIRMADO)) {
            entregadas.put((Long) fila[0], ((Number) fila[1]).intValue());
        }
        return entregadas;
    }

    /**
     * Indica si un lote está vencido (el día del vencimiento todavía es vigente).
     *
     * @param lote lote.
     * @return true si está vencido.
     */
    public boolean vencido(LoteMedicamento lote) {
        return lote.getFechaVencimiento() != null && lote.getFechaVencimiento().isBefore(LocalDate.now());
    }

    /**
     * Unidades disponibles en lotes vigentes por producto.
     *
     * @param medicamentoIds productos a consultar.
     * @return unidades vigentes por identificador de producto.
     */
    public Map<Long, Integer> disponibles(Collection<Long> medicamentoIds) {
        if (medicamentoIds.isEmpty()) {
            return Map.of();
        }
        return loteRepository.findByMedicamento_IdIn(medicamentoIds).stream()
                .filter(l -> l.getCantidadDisponible() > 0 && !this.vencido(l))
                .collect(Collectors.groupingBy(l -> l.getMedicamento().getId(),
                        Collectors.summingInt(LoteMedicamento::getCantidadDisponible)));
    }

    /**
     * Calcula el estado del despacho según lo entregado.
     *
     * @param formula fórmula.
     * @return DESPACHADO si no queda nada pendiente, DESPACHO_PARCIAL si se
     *         entregó algo y PENDIENTE_DESPACHO si no se ha entregado nada.
     */
    public EstadoDespacho estadoSegunEntregas(FormulaMedica formula) {
        Map<Long, Integer> entregadas = this.entregadas(formula.getFormulaId());
        boolean algoEntregado = entregadas.values().stream().anyMatch(c -> c > 0);
        boolean todoEntregado = formula.getDetalles().stream().allMatch(d ->
                entregadas.getOrDefault(d.getDetalleId(), 0) >= d.getCantidadPrescrita());
        if (todoEntregado) {
            return EstadoDespacho.DESPACHADO;
        }
        return algoEntregado ? EstadoDespacho.DESPACHO_PARCIAL : EstadoDespacho.PENDIENTE_DESPACHO;
    }

    /**
     * Registra un cambio de estado en el historial.
     *
     * @param formula     fórmula afectada.
     * @param anterior    estado anterior (puede ser nulo).
     * @param nuevo       estado nuevo.
     * @param usuario     usuario responsable.
     * @param observacion observación o motivo.
     */
    public void registrarEstado(FormulaMedica formula, Enum<?> anterior, Enum<?> nuevo,
                                Usuario usuario, String observacion) {
        FormulaEstadoHistorial registro = new FormulaEstadoHistorial();
        registro.setFormula(formula);
        registro.setEstadoAnterior(anterior == null ? null : anterior.name());
        registro.setEstadoNuevo(nuevo.name());
        registro.setUsuario(usuario);
        registro.setFecha(LocalDateTime.now());
        registro.setObservacion(observacion);
        historialRepository.save(registro);
    }

    /**
     * Convierte una fórmula en su resumen para el listado.
     *
     * @param formula fórmula.
     * @return resumen sin detalle.
     */
    public FormulaRs resumen(FormulaMedica formula) {
        HistoriaClinica historia = formula.getHistoria();
        Mascota mascota = historia.getMascota();
        Cliente cliente = mascota.getCliente();

        FormulaRs rs = new FormulaRs();
        rs.setFormulaId(formula.getFormulaId());
        rs.setFechaEmision(formula.getFechaEmision());
        rs.setHistoriaId(historia.getHistoriaId());
        rs.setHistoriaFecha(historia.getFechaHora().toLocalDate());
        rs.setClienteId(cliente.getClienteId());
        rs.setClienteNombre(cliente.getNombres() + " " + cliente.getApellidos());
        rs.setMascotaId(mascota.getMascotaId());
        rs.setMascotaNombre(mascota.getNombreMascota());
        rs.setMedicoId(formula.getMedico().getId());
        rs.setMedicoNombre(formula.getMedico().getNombres() + " " + formula.getMedico().getApellidos());
        rs.setObservaciones(formula.getObservaciones());
        rs.setEstado(formula.getEstado().name());
        rs.setEstadoDespacho(formula.getEstadoDespacho() == null ? null : formula.getEstadoDespacho().name());
        rs.setTotalMedicamentos(formula.getDetalles().size());
        rs.setMedicamentosResumen(formula.getDetalles().stream()
                .map(d -> d.getMedicamento().getNombre()).collect(Collectors.joining(", ")));
        rs.setFechaConfirmacion(formula.getFechaConfirmacion());
        rs.setFechaCreacion(formula.getFechaCreacion());
        rs.setFechaModificacion(formula.getFechaModificacion());
        return rs;
    }

    /**
     * Convierte una fórmula en su detalle completo: líneas con avance de
     * entrega y existencias, historial de estados y entregas.
     *
     * @param formula fórmula.
     * @return detalle completo.
     */
    public FormulaRs detalle(FormulaMedica formula) {
        FormulaRs rs = this.resumen(formula);
        Map<Long, Integer> entregadas = this.entregadas(formula.getFormulaId());
        Map<Long, Integer> disponibles = this.disponibles(formula.getDetalles().stream()
                .map(d -> d.getMedicamento().getId()).toList());
        rs.setDetalles(formula.getDetalles().stream()
                .map(d -> this.convertirLinea(d, entregadas, disponibles)).toList());
        rs.setHistorial(historialRepository.findByFormula_FormulaIdOrderByFechaAscHistorialIdAsc(
                formula.getFormulaId()).stream().map(h -> {
                    EstadoHistorialRs e = new EstadoHistorialRs();
                    e.setFecha(h.getFecha());
                    e.setEstadoAnterior(h.getEstadoAnterior());
                    e.setEstadoNuevo(h.getEstadoNuevo());
                    e.setUsuario(h.getUsuario().getUsername());
                    e.setObservacion(h.getObservacion());
                    return e;
                }).toList());
        rs.setDespachos(despachoRepository.findByFormula_FormulaIdOrderByFechaAsc(formula.getFormulaId())
                .stream().map(this::convertirDespacho).toList());
        return rs;
    }

    /**
     * Convierte una línea de la fórmula con su avance de entrega.
     *
     * @param linea       línea.
     * @param entregadas  unidades entregadas por línea.
     * @param disponibles unidades vigentes por producto.
     * @return respuesta de la línea.
     */
    public FormulaDetalleRs convertirLinea(FormulaDetalle linea, Map<Long, Integer> entregadas,
                                           Map<Long, Integer> disponibles) {
        Medicamento medicamento = linea.getMedicamento();
        int entregada = entregadas.getOrDefault(linea.getDetalleId(), 0);
        FormulaDetalleRs rs = new FormulaDetalleRs();
        rs.setDetalleId(linea.getDetalleId());
        rs.setMedicamentoId(medicamento.getId());
        rs.setMedicamentoCodigo(medicamento.getCodigo());
        rs.setMedicamentoNombre(medicamento.getNombre());
        rs.setPresentacion(medicamento.getPresentacion());
        rs.setDosis(linea.getDosis());
        rs.setUnidadDosis(linea.getUnidadDosis());
        rs.setFrecuenciaHoras(linea.getFrecuenciaHoras());
        rs.setDuracionDias(linea.getDuracionDias());
        rs.setViaAdministracion(linea.getViaAdministracion());
        rs.setIndicaciones(linea.getIndicaciones());
        rs.setCantidadPrescrita(linea.getCantidadPrescrita());
        rs.setCantidadEntregada(entregada);
        rs.setCantidadPendiente(Math.max(0, linea.getCantidadPrescrita() - entregada));
        rs.setDisponible(disponibles.getOrDefault(medicamento.getId(), 0));
        return rs;
    }

    /**
     * Convierte una entrega con su trazabilidad.
     *
     * @param despacho entrega.
     * @return respuesta de la entrega.
     */
    public DespachoRs convertirDespacho(Despacho despacho) {
        FormulaMedica formula = despacho.getFormula();
        Mascota mascota = formula.getHistoria().getMascota();
        DespachoRs rs = new DespachoRs();
        rs.setDespachoId(despacho.getDespachoId());
        rs.setFormulaId(formula.getFormulaId());
        rs.setFecha(despacho.getFecha());
        rs.setUsuario(despacho.getUsuario().getUsername());
        rs.setEstado(despacho.getEstado().name());
        rs.setEstadoDespachoFormula(formula.getEstadoDespacho() == null ? null : formula.getEstadoDespacho().name());
        rs.setObservacion(despacho.getObservacion());
        rs.setMascotaNombre(mascota.getNombreMascota());
        rs.setClienteNombre(mascota.getCliente().getNombres() + " " + mascota.getCliente().getApellidos());
        rs.setMedicoNombre(formula.getMedico().getNombres() + " " + formula.getMedico().getApellidos());
        rs.setUsuarioReversion(despacho.getUsuarioReversion() == null ? null
                : despacho.getUsuarioReversion().getUsername());
        rs.setFechaReversion(despacho.getFechaReversion());
        rs.setMotivoReversion(despacho.getMotivoReversion());
        List<DespachoDetalleRs> detalles = despacho.getDetalles().stream().map(d -> {
            DespachoDetalleRs linea = new DespachoDetalleRs();
            linea.setMedicamentoNombre(d.getLote().getMedicamento().getNombre());
            linea.setMedicamentoCodigo(d.getLote().getMedicamento().getCodigo());
            linea.setNumeroLote(d.getLote().getNumeroLote());
            linea.setFechaVencimiento(d.getLote().getFechaVencimiento());
            linea.setCantidad(d.getCantidad());
            return linea;
        }).toList();
        rs.setDetalles(detalles);
        return rs;
    }
}
