package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Despacho;
import com.uniminuto.clinica.entity.DespachoDetalle;
import com.uniminuto.clinica.entity.EstadoDespacho;
import com.uniminuto.clinica.entity.EstadoEntrega;
import com.uniminuto.clinica.entity.EstadoFormula;
import com.uniminuto.clinica.entity.FormulaDetalle;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.LoteMedicamento;
import com.uniminuto.clinica.entity.MovimientoInventario;
import com.uniminuto.clinica.entity.TipoMovimiento;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.DespachoFiltroRq;
import com.uniminuto.clinica.models.DespachoRq;
import com.uniminuto.clinica.models.DespachoRs;
import com.uniminuto.clinica.models.EntregaRq;
import com.uniminuto.clinica.models.FormulaFiltroRq;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.LineaDespachoRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MotivoRq;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.PreparacionDespachoRs;
import com.uniminuto.clinica.repository.DespachoRepository;
import com.uniminuto.clinica.repository.DespachoSpecification;
import com.uniminuto.clinica.repository.FormulaRepository;
import com.uniminuto.clinica.repository.FormulaSpecification;
import com.uniminuto.clinica.repository.LoteMedicamentoRepository;
import com.uniminuto.clinica.repository.MovimientoInventarioRepository;
import com.uniminuto.clinica.service.DespachoService;
import com.uniminuto.clinica.util.Paginacion;
import com.uniminuto.clinica.util.PdfDocumentos;
import com.uniminuto.clinica.util.UsuarioActual;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Implementación del despacho de medicamentos. Reglas obligatorias:
 * <ol>
 *     <li>Solo el perfil DESPACHO_MEDICO opera el módulo (se valida en SeguridadConfig).</li>
 *     <li>Despacho no modifica dosis, indicaciones ni cantidades prescritas: solo registra entregas.</li>
 *     <li>El inventario se descuenta únicamente al confirmar la entrega.</li>
 *     <li>No se entregan lotes vencidos ni cantidades mayores a las disponibles o a lo pendiente.</li>
 *     <li>Se permiten entregas parciales.</li>
 *     <li>Cada salida queda enlazada a la entrega y a la fórmula, con usuario, fecha y hora.</li>
 *     <li>Fórmula y lotes se bloquean durante la operación: una entrega no se descuenta dos veces
 *         y un error no deja el inventario a medias (todo ocurre en una transacción).</li>
 *     <li>Una entrega confirmada no se elimina: se revierte con motivo, devolviendo las unidades.</li>
 * </ol>
 */
@Service
public class DespachoServiceImpl implements DespachoService {

    /**
     * Días antes del vencimiento en los que un lote se considera próximo a vencer.
     */
    private static final int DIAS_ALERTA_VENCIMIENTO = 60;

    /**
     * Orden de las fórmulas pendientes: las más antiguas primero.
     */
    private static final Map<String, String> ORDEN_PENDIENTES = Map.of(
            "emision", "fechaEmision", "numero", "formulaId", "confirmacion", "fechaConfirmacion");

    /**
     * Orden del historial: las entregas más recientes primero.
     */
    private static final Map<String, String> ORDEN_HISTORIAL = Map.of("fecha", "fecha");

    /**
     * Repositorio de fórmulas.
     */
    @Autowired
    private FormulaRepository formulaRepository;

    /**
     * Repositorio de entregas.
     */
    @Autowired
    private DespachoRepository despachoRepository;

    /**
     * Repositorio de lotes.
     */
    @Autowired
    private LoteMedicamentoRepository loteRepository;

    /**
     * Repositorio de movimientos de inventario.
     */
    @Autowired
    private MovimientoInventarioRepository movimientoRepository;

    /**
     * Operaciones compartidas con fórmulas.
     */
    @Autowired
    private FormulaSoporte soporte;

    /**
     * Usuario autenticado.
     */
    @Autowired
    private UsuarioActual usuarioActual;

    /**
     * Generador de documentos PDF.
     */
    @Autowired
    private PdfDocumentos pdf;

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<FormulaRs> listarPendientes(FormulaFiltroRq filtro) {
        Paginacion.validarRango(filtro.getDesde(), filtro.getHasta());
        filtro.setPendientesDespacho(true);
        return PaginaRs.desde(formulaRepository
                .findAll(FormulaSpecification.conFiltros(filtro, null,
                                Paginacion.convertirEnum(EstadoDespacho.class, filtro.getEstadoDespacho())),
                        Paginacion.crear(filtro.getPage(), filtro.getSize(), filtro.getOrden(),
                                filtro.getDireccion() == null ? "asc" : filtro.getDireccion(),
                                ORDEN_PENDIENTES, "fechaConfirmacion", "formulaId"))
                .map(soporte::resumen));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PreparacionDespachoRs consultarPreparacion(Long formulaId) {
        FormulaMedica formula = soporte.buscar(formulaId);
        if (formula.getEstado() != EstadoFormula.CONFIRMADA) {
            throw new ConflictException("La fórmula no está confirmada por el veterinario");
        }
        Map<Long, Integer> entregadas = soporte.entregadas(formulaId);
        List<Long> productos = formula.getDetalles().stream().map(d -> d.getMedicamento().getId()).toList();
        Map<Long, Integer> disponibles = soporte.disponibles(productos);
        Map<Long, List<LoteMedicamento>> lotes = loteRepository.findByMedicamento_IdIn(productos).stream()
                .filter(l -> l.getCantidadDisponible() > 0)
                .collect(Collectors.groupingBy(l -> l.getMedicamento().getId()));

        PreparacionDespachoRs rs = new PreparacionDespachoRs();
        rs.setFormula(soporte.detalle(formula));
        rs.setLineas(formula.getDetalles().stream().map(detalle -> {
            LineaDespachoRs linea = new LineaDespachoRs();
            linea.setLinea(soporte.convertirLinea(detalle, entregadas, disponibles));
            int pendiente = linea.getLinea().getCantidadPendiente();
            linea.setAlcanza(linea.getLinea().getDisponible() >= pendiente);
            linea.setLotes(this.sugerirLotes(lotes.getOrDefault(detalle.getMedicamento().getId(), List.of()), pendiente));
            return linea;
        }).toList());
        return rs;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS iniciarPreparacion(Long formulaId) {
        FormulaMedica formula = soporte.buscarParaActualizar(formulaId);
        this.validarPorEntregar(formula);
        if (formula.getEstadoDespacho() == EstadoDespacho.EN_PREPARACION) {
            return MiRespuestaRS.de(200, "La fórmula ya está en preparación");
        }
        this.cambiarEstado(formula, EstadoDespacho.EN_PREPARACION, usuarioActual.obtener(),
                "Inicio de la verificación de medicamentos");
        return MiRespuestaRS.de(200, "Fórmula en preparación");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public DespachoRs confirmarEntrega(Long formulaId, DespachoRq rq) {
        if (rq == null || rq.getEntregas() == null || rq.getEntregas().isEmpty()) {
            throw new BadRequestException("Debe indicar al menos un medicamento con su lote y cantidad");
        }
        Usuario usuario = usuarioActual.obtener();
        FormulaMedica formula = soporte.buscarParaActualizar(formulaId);
        this.validarPorEntregar(formula);
        Map<Long, FormulaDetalle> lineas = formula.getDetalles().stream()
                .collect(Collectors.toMap(FormulaDetalle::getDetalleId, Function.identity()));

        // Agrupa por línea y lote (se suman las filas repetidas).
        Map<Long, Map<Long, Integer>> porLinea = new LinkedHashMap<>();
        for (EntregaRq entrega : rq.getEntregas()) {
            if (entrega == null || entrega.getFormulaDetalleId() == null || entrega.getLoteId() == null) {
                throw new BadRequestException("Cada entrega debe indicar la línea de la fórmula y el lote");
            }
            if (entrega.getCantidad() == null || entrega.getCantidad() < 1) {
                throw new BadRequestException("Las cantidades entregadas deben ser enteros mayores que 0");
            }
            if (!lineas.containsKey(entrega.getFormulaDetalleId())) {
                throw new BadRequestException("Una de las líneas no pertenece a la fórmula N.° " + formulaId);
            }
            porLinea.computeIfAbsent(entrega.getFormulaDetalleId(), k -> new LinkedHashMap<>())
                    .merge(entrega.getLoteId(), entrega.getCantidad(), Integer::sum);
        }

        // No se entrega más de lo pendiente por línea.
        Map<Long, Integer> entregadas = soporte.entregadas(formulaId);
        porLinea.forEach((detalleId, porLote) -> {
            FormulaDetalle linea = lineas.get(detalleId);
            int pendiente = linea.getCantidadPrescrita() - entregadas.getOrDefault(detalleId, 0);
            int solicitado = porLote.values().stream().mapToInt(Integer::intValue).sum();
            if (solicitado > pendiente) {
                throw new ConflictException(linea.getMedicamento().getNombre() + ": se intentan entregar "
                        + solicitado + " unidades y solo hay " + Math.max(0, pendiente) + " pendientes");
            }
        });

        // Bloquea los lotes en orden de identificador para evitar bloqueos cruzados.
        Map<Long, Integer> totalPorLote = new TreeMap<>();
        porLinea.values().forEach(porLote -> porLote.forEach((lote, cantidad) ->
                totalPorLote.merge(lote, cantidad, Integer::sum)));
        Map<Long, LoteMedicamento> lotes = new LinkedHashMap<>();
        for (Map.Entry<Long, Integer> e : totalPorLote.entrySet()) {
            LoteMedicamento lote = loteRepository.buscarParaActualizar(e.getKey())
                    .orElseThrow(() -> new NotFoundException("El lote " + e.getKey() + " no existe"));
            if (soporte.vencido(lote)) {
                throw new ConflictException("El lote " + lote.getNumeroLote() + " de "
                        + lote.getMedicamento().getNombre() + " está vencido y no se puede entregar");
            }
            if (e.getValue() > lote.getCantidadDisponible()) {
                throw new ConflictException("El lote " + lote.getNumeroLote() + " de "
                        + lote.getMedicamento().getNombre() + " solo tiene " + lote.getCantidadDisponible()
                        + " unidades; se intentan entregar " + e.getValue());
            }
            lotes.put(lote.getLoteId(), lote);
        }

        Despacho despacho = new Despacho();
        despacho.setFormula(formula);
        despacho.setUsuario(usuario);
        despacho.setEstado(EstadoEntrega.CONFIRMADO);
        despacho.setFecha(LocalDateTime.now());
        despacho.setObservacion(Validaciones.opcional(rq.getObservacion(), "La observación", 255));
        porLinea.forEach((detalleId, porLote) -> porLote.forEach((loteId, cantidad) -> {
            LoteMedicamento lote = lotes.get(loteId);
            FormulaDetalle linea = lineas.get(detalleId);
            if (!lote.getMedicamento().getId().equals(linea.getMedicamento().getId())) {
                throw new BadRequestException("El lote " + lote.getNumeroLote() + " no corresponde a "
                        + linea.getMedicamento().getNombre());
            }
            DespachoDetalle detalle = new DespachoDetalle();
            detalle.setDespacho(despacho);
            detalle.setFormulaDetalle(linea);
            detalle.setLote(lote);
            detalle.setCantidad(cantidad);
            despacho.getDetalles().add(detalle);
        }));
        despachoRepository.save(despacho);

        int unidades = 0;
        for (DespachoDetalle detalle : despacho.getDetalles()) {
            LoteMedicamento lote = detalle.getLote();
            lote.setCantidadDisponible(lote.getCantidadDisponible() - detalle.getCantidad());
            loteRepository.save(lote);
            this.registrarMovimiento(lote, TipoMovimiento.SALIDA, detalle.getCantidad(), despacho, usuario,
                    "Despacho N.° " + despacho.getDespachoId() + " de la fórmula N.° " + formulaId, null);
            unidades += detalle.getCantidad();
        }

        EstadoDespacho nuevo = soporte.estadoSegunEntregas(formula);
        this.cambiarEstado(formula, nuevo, usuario,
                "Despacho N.° " + despacho.getDespachoId() + ": " + unidades + " unidades entregadas");
        return soporte.convertirDespacho(despacho);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS marcarSinDisponibilidad(Long formulaId, MotivoRq rq) {
        FormulaMedica formula = soporte.buscarParaActualizar(formulaId);
        this.validarPorEntregar(formula);
        Map<Long, Integer> entregadas = soporte.entregadas(formulaId);
        Map<Long, Integer> disponibles = soporte.disponibles(formula.getDetalles().stream()
                .map(d -> d.getMedicamento().getId()).toList());
        List<String> faltantes = formula.getDetalles().stream()
                .filter(d -> d.getCantidadPrescrita() - entregadas.getOrDefault(d.getDetalleId(), 0)
                        > disponibles.getOrDefault(d.getMedicamento().getId(), 0))
                .map(d -> d.getMedicamento().getNombre()).toList();
        if (faltantes.isEmpty()) {
            throw new ConflictException("Hay existencias suficientes para todo lo pendiente; registre la entrega");
        }
        String observacion = Validaciones.opcional(rq == null ? null : rq.getMotivo(), "La observación", 200);
        this.cambiarEstado(formula, EstadoDespacho.PENDIENTE_DISPONIBILIDAD, usuarioActual.obtener(),
                "Sin existencias suficientes de: " + String.join(", ", faltantes)
                        + (observacion == null ? "" : ". " + observacion));
        return MiRespuestaRS.de(200, "Fórmula marcada como pendiente por disponibilidad");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS cancelarDespacho(Long formulaId, MotivoRq rq) {
        String motivo = Validaciones.obligatorio(rq == null ? null : rq.getMotivo(), "El motivo de la cancelación", 255);
        FormulaMedica formula = soporte.buscarParaActualizar(formulaId);
        this.validarPorEntregar(formula);
        if (despachoRepository.existsByFormula_FormulaIdAndEstado(formulaId, EstadoEntrega.CONFIRMADO)) {
            throw new ConflictException("La fórmula tiene entregas confirmadas; reviértalas antes de cancelar el despacho");
        }
        this.cambiarEstado(formula, EstadoDespacho.CANCELADO, usuarioActual.obtener(), motivo);
        return MiRespuestaRS.de(200, "Despacho cancelado");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS revertirEntrega(Long despachoId, MotivoRq rq) {
        String motivo = Validaciones.obligatorio(rq == null ? null : rq.getMotivo(), "El motivo de la reversión", 255);
        Usuario usuario = usuarioActual.obtener();
        Despacho despacho = despachoRepository.findById(despachoId)
                .orElseThrow(() -> new NotFoundException("La entrega no existe"));
        FormulaMedica formula = soporte.buscarParaActualizar(despacho.getFormula().getFormulaId());
        if (despacho.getEstado() == EstadoEntrega.REVERTIDO) {
            throw new ConflictException("La entrega N.° " + despachoId + " ya fue revertida");
        }

        List<DespachoDetalle> detalles = new ArrayList<>(despacho.getDetalles());
        detalles.sort(Comparator.comparing(d -> d.getLote().getLoteId()));
        for (DespachoDetalle detalle : detalles) {
            LoteMedicamento lote = loteRepository.buscarParaActualizar(detalle.getLote().getLoteId()).orElseThrow();
            lote.setCantidadDisponible(lote.getCantidadDisponible() + detalle.getCantidad());
            loteRepository.save(lote);
            this.registrarMovimiento(lote, TipoMovimiento.REVERSION, detalle.getCantidad(), despacho, usuario,
                    "Reversión del despacho N.° " + despachoId + " de la fórmula N.° " + formula.getFormulaId(), motivo);
        }
        despacho.setEstado(EstadoEntrega.REVERTIDO);
        despacho.setUsuarioReversion(usuario);
        despacho.setFechaReversion(LocalDateTime.now());
        despacho.setMotivoReversion(motivo);
        despachoRepository.save(despacho);

        this.cambiarEstado(formula, soporte.estadoSegunEntregas(formula), usuario,
                "Reversión del despacho N.° " + despachoId + ": " + motivo);
        return MiRespuestaRS.de(200, "Entrega revertida; las unidades volvieron a sus lotes");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<DespachoRs> listarHistorial(DespachoFiltroRq filtro) {
        Paginacion.validarRango(filtro.getDesde(), filtro.getHasta());
        return PaginaRs.desde(despachoRepository
                .findAll(DespachoSpecification.conFiltros(filtro,
                                Paginacion.convertirEnum(EstadoEntrega.class, filtro.getEstado())),
                        Paginacion.crear(filtro.getPage(), filtro.getSize(), "fecha", "desc",
                                ORDEN_HISTORIAL, "fecha", "despachoId"))
                .map(soporte::convertirDespacho));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public byte[] generarComprobante(Long despachoId) {
        Despacho despacho = despachoRepository.findById(despachoId)
                .orElseThrow(() -> new NotFoundException("La entrega no existe"));
        return pdf.comprobanteDespacho(soporte.convertirDespacho(despacho), soporte.resumen(despacho.getFormula()));
    }

    /**
     * Valida que la fórmula esté confirmada y tenga medicamentos por entregar.
     *
     * @param formula fórmula.
     */
    private void validarPorEntregar(FormulaMedica formula) {
        if (formula.getEstado() != EstadoFormula.CONFIRMADA) {
            throw new ConflictException("La fórmula N.° " + formula.getFormulaId() + " no está confirmada por el veterinario");
        }
        if (!EstadoDespacho.POR_ENTREGAR.contains(formula.getEstadoDespacho())) {
            throw new ConflictException("La fórmula N.° " + formula.getFormulaId() + " no tiene entregas pendientes ("
                    + formula.getEstadoDespacho() + ")");
        }
    }

    /**
     * Cambia el estado del despacho y lo registra en el historial.
     *
     * @param formula     fórmula.
     * @param nuevo       estado nuevo.
     * @param usuario     usuario responsable.
     * @param observacion observación.
     */
    private void cambiarEstado(FormulaMedica formula, EstadoDespacho nuevo, Usuario usuario, String observacion) {
        EstadoDespacho anterior = formula.getEstadoDespacho();
        formula.setEstadoDespacho(nuevo);
        formula.setFechaModificacion(LocalDateTime.now());
        formulaRepository.save(formula);
        soporte.registrarEstado(formula, anterior, nuevo, usuario, observacion);
    }

    /**
     * Sugiere de qué lotes entregar, empezando por el de vencimiento más
     * próximo entre los vigentes. Los vencidos se muestran, pero sin sugerencia.
     *
     * @param lotes     lotes del producto con existencias.
     * @param pendiente unidades pendientes de la línea.
     * @return lotes con su estado y cantidad sugerida.
     */
    private List<LineaDespachoRs.LoteDespachoRs> sugerirLotes(List<LoteMedicamento> lotes, int pendiente) {
        LocalDate alerta = LocalDate.now().plusDays(DIAS_ALERTA_VENCIMIENTO);
        List<LoteMedicamento> ordenados = lotes.stream()
                .sorted(Comparator.comparing(LoteMedicamento::getFechaVencimiento,
                        Comparator.nullsLast(Comparator.naturalOrder())).thenComparing(LoteMedicamento::getLoteId))
                .toList();
        int restante = pendiente;
        List<LineaDespachoRs.LoteDespachoRs> resultado = new ArrayList<>();
        for (LoteMedicamento lote : ordenados) {
            boolean vencido = soporte.vencido(lote);
            LineaDespachoRs.LoteDespachoRs rs = new LineaDespachoRs.LoteDespachoRs();
            rs.setLoteId(lote.getLoteId());
            rs.setNumeroLote(lote.getNumeroLote());
            rs.setFechaVencimiento(lote.getFechaVencimiento());
            rs.setDisponible(lote.getCantidadDisponible());
            rs.setEstado(vencido ? "VENCIDO"
                    : lote.getFechaVencimiento() != null && !lote.getFechaVencimiento().isAfter(alerta)
                    ? "PROXIMO_A_VENCER" : "VIGENTE");
            int sugerido = vencido ? 0 : Math.min(restante, lote.getCantidadDisponible());
            rs.setSugerido(sugerido);
            restante -= sugerido;
            resultado.add(rs);
        }
        return resultado;
    }

    /**
     * Registra un movimiento de inventario relacionado con una entrega.
     *
     * @param lote        lote afectado, ya actualizado.
     * @param tipo        SALIDA o REVERSION.
     * @param cantidad    unidades movidas.
     * @param despacho    entrega relacionada.
     * @param usuario     usuario responsable.
     * @param referencia  referencia legible.
     * @param observacion observación o motivo.
     */
    private void registrarMovimiento(LoteMedicamento lote, TipoMovimiento tipo, int cantidad, Despacho despacho,
                                     Usuario usuario, String referencia, String observacion) {
        MovimientoInventario movimiento = new MovimientoInventario();
        movimiento.setMedicamento(lote.getMedicamento());
        movimiento.setLote(lote);
        movimiento.setTipo(tipo);
        movimiento.setCantidad(cantidad);
        movimiento.setSaldoLote(lote.getCantidadDisponible());
        movimiento.setFecha(LocalDateTime.now());
        movimiento.setUsuario(usuario);
        movimiento.setReferencia(referencia);
        movimiento.setObservacion(observacion);
        movimiento.setFormula(despacho.getFormula());
        movimiento.setDespacho(despacho);
        movimientoRepository.save(movimiento);
        Objects.requireNonNull(movimiento.getMovimientoId());
    }
}
