package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.EstadoDespacho;
import com.uniminuto.clinica.entity.EstadoFactura;
import com.uniminuto.clinica.entity.EstadoFormula;
import com.uniminuto.clinica.entity.EstadoHistoria;
import com.uniminuto.clinica.entity.Factura;
import com.uniminuto.clinica.entity.FacturaDetalle;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.MedioPago;
import com.uniminuto.clinica.entity.Pago;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.exception.SinPermisoException;
import com.uniminuto.clinica.models.FacturaFiltroRq;
import com.uniminuto.clinica.models.FacturaRq;
import com.uniminuto.clinica.models.FacturaRs;
import com.uniminuto.clinica.models.LineaCobroRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MotivoRq;
import com.uniminuto.clinica.models.PagoRq;
import com.uniminuto.clinica.models.PagoRs;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.repository.FacturaRepository;
import com.uniminuto.clinica.repository.FacturaSpecification;
import com.uniminuto.clinica.repository.FormulaRepository;
import com.uniminuto.clinica.repository.HistoriaClinicaRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.repository.PagoRepository;
import com.uniminuto.clinica.repository.ServicioRepository;
import com.uniminuto.clinica.service.FacturaService;
import com.uniminuto.clinica.util.Dinero;
import com.uniminuto.clinica.util.Paginacion;
import com.uniminuto.clinica.util.PdfDocumentos;
import com.uniminuto.clinica.util.UsuarioActual;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Facturación de servicios veterinarios. Reglas:
 * <ul>
 *     <li>Solo una atención finalizada se factura, y una sola vez (también hay restricción única en la base).</li>
 *     <li>Los servicios se cobran con la tarifa congelada en la atención y los medicamentos solo por
 *         las unidades efectivamente dispensadas, al precio de venta vigente al facturar; todo queda
 *         guardado en la factura y no cambia aunque luego cambien las tarifas.</li>
 *     <li>El descuento lo autoriza solo el administrador, con motivo y sin superar el subtotal; el IVA
 *         se calcula por línea según el porcentaje del servicio o producto.</li>
 *     <li>Los pagos no superan el saldo; el estado pasa a pago parcial o pagada.</li>
 *     <li>La anulación es del administrador, exige motivo, solo procede sin pagos y conserva el registro.</li>
 * </ul>
 */
@Service
public class FacturaServiceImpl implements FacturaService {

    /** Formato de fecha y hora de los documentos. */
    private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a");

    /** Nombres visibles de los estados. */
    private static final Map<EstadoFactura, String> NOMBRES_ESTADO = Map.of(
            EstadoFactura.PENDIENTE_PAGO, "Pendiente de pago",
            EstadoFactura.PAGO_PARCIAL, "Pago parcial",
            EstadoFactura.PAGADA, "Pagada",
            EstadoFactura.ANULADA, "Anulada");

    /** Facturas. */
    @Autowired
    private FacturaRepository facturaRepository;

    /** Pagos. */
    @Autowired
    private PagoRepository pagoRepository;

    /** Atenciones. */
    @Autowired
    private HistoriaClinicaRepository historiaRepository;

    /** Fórmulas. */
    @Autowired
    private FormulaRepository formulaRepository;

    /** Servicios. */
    @Autowired
    private ServicioRepository servicioRepository;

    /** Productos. */
    @Autowired
    private MedicamentoRepository medicamentoRepository;

    /** Cálculo de cobros. */
    @Autowired
    private CalculoCobro calculoCobro;

    /** Generador de PDF. */
    @Autowired
    private PdfDocumentos pdf;

    /** Usuario autenticado. */
    @Autowired
    private UsuarioActual usuarioActual;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<FacturaRs> porFacturar() {
        return historiaRepository.buscarPorFacturar().stream()
                .map(h -> this.calcularVistaPrevia(h, BigDecimal.ZERO)).toList();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public FacturaRs vistaPrevia(Long historiaId) {
        return this.calcularVistaPrevia(this.atencionFacturable(historiaId, false), BigDecimal.ZERO);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public FacturaRs generar(FacturaRq rq) {
        if (rq == null || rq.getHistoriaId() == null) {
            throw new BadRequestException("Indique la atención a facturar");
        }
        Usuario usuario = usuarioActual.obtener();
        HistoriaClinica historia = this.atencionFacturable(rq.getHistoriaId(), true);
        BigDecimal descuento = rq.getDescuento() == null ? BigDecimal.ZERO
                : Dinero.validar(rq.getDescuento(), "El descuento", false);
        String motivoDescuento = null;
        if (descuento.signum() > 0) {
            if (!"ADMIN".equals(usuario.getRol())) {
                throw new SinPermisoException("Solo el administrador puede autorizar descuentos");
            }
            motivoDescuento = Validaciones.obligatorio(rq.getMotivoDescuento(), "El motivo del descuento", 255);
        }

        List<LineaCobroRs> lineas = this.lineas(historia.getHistoriaId());
        if (lineas.isEmpty()) {
            throw new ConflictException("La atención no tiene servicios ni medicamentos para facturar");
        }
        List<String> sinPrecio = lineas.stream().filter(l -> "MEDICAMENTO".equals(l.getTipo()) && l.getObservacion() != null)
                .map(LineaCobroRs::getDescripcion).toList();
        if (!sinPrecio.isEmpty()) {
            throw new ConflictException("Asigne el precio de venta en el inventario antes de facturar: "
                    + String.join(", ", sinPrecio));
        }
        CalculoCobro.Totales t = calculoCobro.calcular(lineas, BigDecimal.ZERO);
        if (descuento.compareTo(t.subtotal()) > 0) {
            throw new BadRequestException("El descuento no puede superar el subtotal (" + PdfDocumentos.moneda(t.subtotal()) + ")");
        }
        t = calculoCobro.calcular(lineas, descuento);

        Mascota mascota = historia.getMascota();
        Factura factura = new Factura();
        factura.setNumero("TMP-" + System.nanoTime() % 1_000_000_000_000L);
        factura.setHistoria(historia);
        factura.setCliente(mascota.getCliente());
        factura.setMascota(mascota);
        factura.setMedico(historia.getMedico());
        factura.setEspecialidad(historia.getMedico().getEspecializacion() == null ? "General"
                : historia.getMedico().getEspecializacion().getNombre());
        factura.setFecha(LocalDateTime.now());
        factura.setSubtotal(t.subtotal());
        factura.setDescuento(t.descuento());
        factura.setMotivoDescuento(motivoDescuento);
        factura.setIva(t.iva());
        factura.setTotal(t.total());
        factura.setPagado(BigDecimal.ZERO);
        factura.setEstado(t.total().signum() == 0 ? EstadoFactura.PAGADA : EstadoFactura.PENDIENTE_PAGO);
        factura.setUsuario(usuario);
        for (LineaCobroRs l : lineas) {
            FacturaDetalle d = new FacturaDetalle();
            d.setFactura(factura);
            d.setTipo(l.getTipo());
            d.setServicio(l.getServicioId() == null ? null : servicioRepository.getReferenceById(l.getServicioId()));
            d.setMedicamento(l.getMedicamentoId() == null ? null : medicamentoRepository.getReferenceById(l.getMedicamentoId()));
            d.setDescripcion(l.getDescripcion());
            d.setCantidad(l.getCantidad());
            d.setValorUnitario(l.getValorUnitario());
            d.setIvaPorcentaje(l.getIvaPorcentaje());
            d.setSubtotal(l.getSubtotal());
            d.setDescuento(l.getDescuento());
            d.setIva(l.getIva());
            d.setTotal(l.getTotal());
            factura.getDetalles().add(d);
        }
        facturaRepository.saveAndFlush(factura);
        factura.setNumero(String.format("FV-%06d", factura.getFacturaId()));
        facturaRepository.save(factura);
        return this.convertir(factura, true);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<FacturaRs> listar(FacturaFiltroRq filtro) {
        Paginacion.validarRango(filtro.getDesde(), filtro.getHasta());
        EstadoFactura estado = Paginacion.convertirEnum(EstadoFactura.class, filtro.getEstado());
        return PaginaRs.desde(facturaRepository
                .findAll(FacturaSpecification.conFiltros(filtro, estado),
                        Paginacion.crear(filtro.getPage(), filtro.getSize(), "fecha", "desc",
                                Map.of("fecha", "fecha"), "fecha", "facturaId"))
                .map(f -> this.convertir(f, false)));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public FacturaRs consultar(Long facturaId) {
        return this.convertir(this.buscar(facturaId), true);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS registrarPago(Long facturaId, PagoRq rq) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos del pago");
        }
        BigDecimal valor = Dinero.validar(rq.getValor(), "El valor del pago", true);
        MedioPago medio = Paginacion.convertirEnum(MedioPago.class, rq.getMedio());
        if (medio == null) {
            throw new BadRequestException("Indique el medio de pago");
        }
        String referencia = Validaciones.opcional(rq.getReferencia(), "La referencia", 100);
        if (medio != MedioPago.EFECTIVO && referencia == null) {
            throw new BadRequestException("Indique la referencia o el número de aprobación del pago");
        }
        Factura factura = facturaRepository.buscarParaActualizar(facturaId)
                .orElseThrow(() -> new NotFoundException("La factura no existe"));
        if (factura.getEstado() == EstadoFactura.ANULADA) {
            throw new ConflictException("La factura está anulada");
        }
        BigDecimal saldo = factura.getTotal().subtract(factura.getPagado());
        if (saldo.signum() <= 0) {
            throw new ConflictException("La factura ya está pagada");
        }
        if (valor.compareTo(saldo) > 0) {
            throw new ConflictException("El pago supera el saldo pendiente (" + PdfDocumentos.moneda(saldo) + ")");
        }
        Pago pago = new Pago();
        pago.setFactura(factura);
        pago.setFecha(LocalDateTime.now());
        pago.setValor(valor);
        pago.setMedio(medio);
        pago.setReferencia(referencia);
        pago.setUsuario(usuarioActual.obtener());
        pagoRepository.save(pago);

        factura.setPagado(Dinero.redondear(factura.getPagado().add(valor)));
        factura.setEstado(factura.getPagado().compareTo(factura.getTotal()) >= 0
                ? EstadoFactura.PAGADA : EstadoFactura.PAGO_PARCIAL);
        facturaRepository.save(factura);
        return MiRespuestaRS.de(201, factura.getEstado() == EstadoFactura.PAGADA
                ? "Pago registrado; la factura " + factura.getNumero() + " quedó pagada"
                : "Pago registrado; saldo pendiente " + PdfDocumentos.moneda(factura.getTotal().subtract(factura.getPagado())));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS anular(Long facturaId, MotivoRq rq) {
        String motivo = Validaciones.obligatorio(rq == null ? null : rq.getMotivo(), "El motivo de la anulación", 255);
        Factura factura = facturaRepository.buscarParaActualizar(facturaId)
                .orElseThrow(() -> new NotFoundException("La factura no existe"));
        if (factura.getEstado() == EstadoFactura.ANULADA) {
            throw new ConflictException("La factura ya está anulada");
        }
        if (factura.getPagado().signum() > 0) {
            throw new ConflictException("La factura tiene pagos registrados por " + PdfDocumentos.moneda(factura.getPagado())
                    + "; no se puede anular");
        }
        factura.setEstado(EstadoFactura.ANULADA);
        factura.setUsuarioAnulacion(usuarioActual.obtener());
        factura.setFechaAnulacion(LocalDateTime.now());
        factura.setMotivoAnulacion(motivo);
        facturaRepository.save(factura);
        return MiRespuestaRS.de(200, "Factura " + factura.getNumero() + " anulada; se conserva como registro");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public byte[] generarPdf(Long facturaId) {
        FacturaRs f = this.convertir(this.buscar(facturaId), true);
        String[][] datos = {
            {"Fecha", f.getFecha().format(FECHA_HORA)},
            {"Estado", NOMBRES_ESTADO.get(EstadoFactura.valueOf(f.getEstado()))},
            {"Propietario", f.getClienteNombre()},
            {"Documento", f.getClienteDocumento()},
            {"Teléfono", f.getClienteTelefono()},
            {"Dirección", f.getClienteDireccion()},
            {"Mascota", f.getMascotaNombre() + (f.getMascotaRaza() == null ? "" : " · " + f.getMascotaRaza())},
            {"Atención", "N.° " + f.getHistoriaId() + " del " + f.getFechaAtencion().toLocalDate()},
            {"Veterinario", f.getMedicoNombre()},
            {"Especialidad", f.getEspecialidad()}
        };
        List<String[]> extras = new ArrayList<>();
        extras.add(new String[]{"Pagado", PdfDocumentos.moneda(f.getPagado())});
        extras.add(new String[]{"Saldo", PdfDocumentos.moneda(f.getSaldo())});
        StringBuilder nota = new StringBuilder();
        if (f.getMotivoDescuento() != null) {
            nota.append("Descuento autorizado: ").append(f.getMotivoDescuento()).append(". ");
        }
        if (!f.getPagos().isEmpty()) {
            nota.append("Pagos: ");
            f.getPagos().forEach(p -> nota.append(p.getFecha().format(FECHA_HORA)).append(" ")
                    .append(p.getMedio().replace('_', ' ').toLowerCase()).append(" ")
                    .append(PdfDocumentos.moneda(p.getValor())).append("; "));
        }
        if ("ANULADA".equals(f.getEstado())) {
            nota.append("FACTURA ANULADA el ").append(f.getFechaAnulacion().format(FECHA_HORA)).append(" por ")
                    .append(f.getUsuarioAnulacion()).append(". Motivo: ").append(f.getMotivoAnulacion()).append(". ");
        }
        nota.append("Generada por ").append(f.getUsuario()).append(".");
        return pdf.documentoCobro("FACTURA DE VENTA " + f.getNumero(), datos, f.getLineas(), f.getSubtotal(),
                f.getDescuento(), f.getIva(), f.getTotal(), extras, nota.toString());
    }

    // ===================== Utilidades =====================

    /**
     * Valida que la atención esté finalizada y sin factura vigente.
     *
     * @param bloquear si se bloquea la atención hasta terminar la transacción (al generar).
     */
    private HistoriaClinica atencionFacturable(Long historiaId, boolean bloquear) {
        HistoriaClinica h = (bloquear ? historiaRepository.buscarParaActualizar(historiaId) : historiaRepository.findById(historiaId))
                .orElseThrow(() -> new NotFoundException("La atención no existe"));
        if (h.getEstado() != EstadoHistoria.CERRADA || h.getCita() == null) {
            throw new ConflictException("Solo se factura una cita atendida con la atención finalizada");
        }
        facturaRepository.findFirstByHistoria_HistoriaIdAndEstadoNot(historiaId, EstadoFactura.ANULADA).ifPresent(f -> {
            throw new ConflictException("La atención ya tiene la factura " + f.getNumero() + "; no se cobra dos veces");
        });
        return h;
    }

    /**
     * Servicios prestados más medicamentos dispensados.
     */
    private List<LineaCobroRs> lineas(Long historiaId) {
        List<LineaCobroRs> lineas = new ArrayList<>(calculoCobro.servicios(historiaId));
        lineas.addAll(calculoCobro.medicamentosDispensados(historiaId));
        return lineas;
    }

    /**
     * Factura calculada sin guardar, con advertencias.
     */
    private FacturaRs calcularVistaPrevia(HistoriaClinica h, BigDecimal descuento) {
        List<LineaCobroRs> lineas = this.lineas(h.getHistoriaId());
        CalculoCobro.Totales t = calculoCobro.calcular(lineas, descuento);
        FacturaRs rs = new FacturaRs();
        this.datosAtencion(rs, h);
        rs.setFecha(LocalDateTime.now());
        rs.setEspecialidad(h.getMedico().getEspecializacion() == null ? "General"
                : h.getMedico().getEspecializacion().getNombre());
        rs.setSubtotal(t.subtotal());
        rs.setDescuento(t.descuento());
        rs.setIva(t.iva());
        rs.setTotal(t.total());
        rs.setPagado(BigDecimal.ZERO);
        rs.setSaldo(t.total());
        rs.setLineas(lineas);
        rs.setPagos(List.of());
        List<String> advertencias = new ArrayList<>();
        formulaRepository.findByHistoria_HistoriaIdOrderByFormulaIdAsc(h.getHistoriaId()).stream()
                .filter(f -> f.getEstado() == EstadoFormula.CONFIRMADA && EstadoDespacho.POR_ENTREGAR.contains(f.getEstadoDespacho()))
                .forEach(f -> advertencias.add("La fórmula N.° " + f.getFormulaId()
                        + " aún tiene medicamentos por entregar; solo se factura lo ya dispensado"));
        lineas.stream().filter(l -> "MEDICAMENTO".equals(l.getTipo()) && l.getObservacion() != null)
                .forEach(l -> advertencias.add(l.getDescripcion() + " no tiene precio de venta en el inventario"));
        rs.setAdvertencias(advertencias);
        return rs;
    }

    /**
     * Datos de la atención, el propietario, la mascota y el veterinario.
     */
    private void datosAtencion(FacturaRs rs, HistoriaClinica h) {
        Mascota m = h.getMascota();
        Cliente c = m.getCliente();
        rs.setHistoriaId(h.getHistoriaId());
        rs.setCitaId(h.getCita() == null ? null : h.getCita().getCitaId());
        rs.setFechaAtencion(h.getFechaHora());
        rs.setClienteId(c.getClienteId());
        rs.setClienteNombre(c.getNombres() + " " + c.getApellidos());
        rs.setClienteDocumento(c.getTipoDocumento() + " " + c.getNumeroDocumento());
        rs.setClienteTelefono(c.getTelefono());
        rs.setClienteDireccion(c.getDireccion());
        rs.setMascotaId(m.getMascotaId());
        rs.setMascotaNombre(m.getNombreMascota());
        rs.setMascotaRaza(m.getRaza() == null ? null : m.getRaza().getNombre() + " (" + m.getRaza().getEspecie() + ")");
        rs.setMedicoNombre(h.getMedico().getNombres() + " " + h.getMedico().getApellidos());
    }

    /**
     * Convierte una factura guardada.
     *
     * @param completa si incluye líneas y pagos.
     */
    private FacturaRs convertir(Factura f, boolean completa) {
        FacturaRs rs = new FacturaRs();
        this.datosAtencion(rs, f.getHistoria());
        rs.setFacturaId(f.getFacturaId());
        rs.setNumero(f.getNumero());
        rs.setFecha(f.getFecha());
        rs.setEspecialidad(f.getEspecialidad());
        rs.setSubtotal(f.getSubtotal());
        rs.setDescuento(f.getDescuento());
        rs.setMotivoDescuento(f.getMotivoDescuento());
        rs.setIva(f.getIva());
        rs.setTotal(f.getTotal());
        rs.setPagado(f.getPagado());
        rs.setSaldo(f.getEstado() == EstadoFactura.ANULADA ? BigDecimal.ZERO : f.getTotal().subtract(f.getPagado()));
        rs.setEstado(f.getEstado().name());
        rs.setUsuario(f.getUsuario().getUsername());
        rs.setUsuarioAnulacion(f.getUsuarioAnulacion() == null ? null : f.getUsuarioAnulacion().getUsername());
        rs.setFechaAnulacion(f.getFechaAnulacion());
        rs.setMotivoAnulacion(f.getMotivoAnulacion());
        if (completa) {
            rs.setLineas(f.getDetalles().stream().map(d -> {
                LineaCobroRs l = new LineaCobroRs();
                l.setTipo(d.getTipo());
                l.setServicioId(d.getServicio() == null ? null : d.getServicio().getServicioId());
                l.setMedicamentoId(d.getMedicamento() == null ? null : d.getMedicamento().getId());
                l.setCodigo(d.getServicio() != null ? d.getServicio().getCodigo()
                        : d.getMedicamento() != null ? d.getMedicamento().getCodigo() : null);
                l.setDescripcion(d.getDescripcion());
                l.setCantidad(d.getCantidad());
                l.setValorUnitario(d.getValorUnitario());
                l.setIvaPorcentaje(d.getIvaPorcentaje());
                l.setSubtotal(d.getSubtotal());
                l.setDescuento(d.getDescuento());
                l.setIva(d.getIva());
                l.setTotal(d.getTotal());
                return l;
            }).toList());
            rs.setPagos(pagoRepository.findByFactura_FacturaIdOrderByFechaAscPagoIdAsc(f.getFacturaId()).stream().map(p -> {
                PagoRs pr = new PagoRs();
                pr.setPagoId(p.getPagoId());
                pr.setFecha(p.getFecha());
                pr.setValor(p.getValor());
                pr.setMedio(p.getMedio().name());
                pr.setReferencia(p.getReferencia());
                pr.setUsuario(p.getUsuario().getUsername());
                return pr;
            }).toList());
        }
        return rs;
    }

    /**
     * Busca una factura o responde 404.
     */
    private Factura buscar(Long facturaId) {
        return facturaRepository.findById(facturaId).orElseThrow(() -> new NotFoundException("La factura no existe"));
    }
}
