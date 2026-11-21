package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.AtencionServicio;
import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.DespachoDetalle;
import com.uniminuto.clinica.entity.Factura;
import com.uniminuto.clinica.entity.FacturaDetalle;
import com.uniminuto.clinica.entity.FacturaHistorial;
import com.uniminuto.clinica.entity.Impuesto;
import com.uniminuto.clinica.entity.Pago;
import com.uniminuto.clinica.entity.Tarifa;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.ForbiddenException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.FacturaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PagoRq;
import com.uniminuto.clinica.repository.AtencionServicioRepository;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.DespachoDetalleRepository;
import com.uniminuto.clinica.repository.FacturaHistorialRepository;
import com.uniminuto.clinica.repository.FacturaRepository;
import com.uniminuto.clinica.repository.PagoRepository;
import com.uniminuto.clinica.security.ContextoUsuario;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.AuthService;
import com.uniminuto.clinica.service.FacturaService;
import com.uniminuto.clinica.utils.Constantes;
import com.uniminuto.clinica.utils.Formato;
import com.uniminuto.clinica.utils.Validar;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Facturación de servicios veterinarios.
 * - Sólo una cita ATENDIDA genera factura, y sólo una factura vigente por cita
 *   (validación en servicio + índice único sobre columna generada en la BD).
 * - Los productos facturados son los efectivamente dispensados (despacho_detalle),
 *   cada uno una única vez.
 * - Valores, impuestos y descripción se copian a la factura (histórico).
 * - Anular conserva los registros: cambia estado y deja trazabilidad.
 */
@Service
public class FacturaServiceImpl implements FacturaService {

    private static final BigDecimal CIEN = BigDecimal.valueOf(100);

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private FacturaHistorialRepository historialRepository;

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private AtencionServicioRepository servicioRepository;

    @Autowired
    private DespachoDetalleRepository despachoDetalleRepository;

    @Autowired
    private AuthService authService;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private Bloqueos bloqueos;

    @Override
    @Transactional(readOnly = true)
    public List<Cita> citasPorFacturar() {
        return citaRepository.findAtendidasSinFactura();
    }

    @Override
    @Transactional(readOnly = true)
    public Factura calcular(Long citaId, BigDecimal porcentajeDescuento) {
        Cita cita = citaFacturable(citaId);
        return construir(cita, Validar.porcentaje(porcentajeDescuento, "porcentaje de descuento"));
    }

    @Override
    @Transactional
    public MiRespuestaRS generar(FacturaRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información de la factura es obligatoria.");
        }
        BigDecimal descuento = Validar.porcentaje(rq.getPorcentajeDescuento(), "porcentaje de descuento");
        boolean conDescuento = descuento.signum() > 0;
        if (conDescuento && !ContextoUsuario.obtener().tienePerfil(Roles.ADMIN)) {
            throw new ForbiddenException("Sólo un administrador puede autorizar descuentos.");
        }
        Validar.idValido(rq.getCitaId(), "citaId");
        // Bloquea la cita para que dos usuarios no la facturen al mismo tiempo
        Cita bloqueada = entityManager.find(Cita.class, rq.getCitaId(), LockModeType.PESSIMISTIC_WRITE);
        if (bloqueada == null) {
            throw new NotFoundException("La cita no existe.");
        }
        Cita cita = citaFacturable(rq.getCitaId());
        Usuario usuario = authService.usuarioActual();
        Factura f = construir(cita, descuento);
        f.setObservaciones(Validar.textoOpcional(rq.getObservaciones(), "observaciones", 1000));
        f.setUsuario(usuario);
        if (conDescuento) {
            f.setUsuarioAutorizaDescuento(usuario);
        }
        f.setEstado(f.getTotal().signum() == 0 ? Constantes.FAC_PAGADA : Constantes.FAC_PENDIENTE);
        facturaRepository.save(f);
        f.setNumero(String.format("FAC-%06d", f.getId()));
        facturaRepository.save(f);
        registrar(f, "GENERACION", null, f.getEstado(), "Factura generada por " + Formato.moneda(f.getTotal())
                + (conDescuento ? " con descuento autorizado del " + descuento + "%" : ""), usuario);
        return MiRespuestaRS.creado("Factura " + f.getNumero() + " generada por " + Formato.moneda(f.getTotal()) + ".", f.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS agregarDispensados(Long facturaId) {
        Factura f = bloquear(facturaId);
        if (!Constantes.FAC_PENDIENTE.equals(f.getEstado()) && !Constantes.FAC_PAGO_PARCIAL.equals(f.getEstado())) {
            throw new ConflictException("Sólo se agregan productos a facturas pendientes o con pago parcial.");
        }
        List<DespachoDetalle> nuevos = despachoDetalleRepository.facturablesPorCita(f.getCita().getId());
        if (nuevos.isEmpty()) {
            throw new ConflictException("No hay productos dispensados pendientes de facturar para esta atención.");
        }
        BigDecimal pct = porcentajeDescuentoActual(f);
        for (DespachoDetalle dd : nuevos) {
            f.getDetalles().add(lineaProducto(f, dd, pct));
        }
        totalizar(f);
        recalcularPagos(f);
        facturaRepository.save(f);
        registrar(f, "AGREGAR_PRODUCTOS", f.getEstado(), f.getEstado(), nuevos.size()
                + " producto(s) dispensado(s) agregado(s). Nuevo total " + Formato.moneda(f.getTotal()), authService.usuarioActual());
        return MiRespuestaRS.ok("Se agregaron " + nuevos.size() + " producto(s). Nuevo total: " + Formato.moneda(f.getTotal()) + ".", f.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS registrarPago(PagoRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información del pago es obligatoria.");
        }
        Validar.idValido(rq.getFacturaId(), "facturaId");
        Factura f = bloquear(rq.getFacturaId());
        if (Constantes.FAC_ANULADA.equals(f.getEstado())) {
            throw new ConflictException("La factura está anulada.");
        }
        if (Constantes.FAC_PAGADA.equals(f.getEstado())) {
            throw new ConflictException("La factura ya está pagada.");
        }
        BigDecimal valor = Validar.dinero(rq.getValor(), "valor del pago", false);
        if (valor.compareTo(f.getSaldo()) > 0) {
            throw new BadRequestException("El pago (" + Formato.moneda(valor) + ") supera el saldo pendiente ("
                    + Formato.moneda(f.getSaldo()) + ").");
        }
        String metodo = Validar.enLista(rq.getMetodoPago(), Constantes.METODOS_PAGO, "método de pago");
        String referencia = Validar.textoOpcional(rq.getReferencia(), "referencia", 100);
        if (!"EFECTIVO".equals(metodo) && referencia == null) {
            throw new BadRequestException("La referencia (voucher / transacción) es obligatoria para pagos no en efectivo.");
        }
        Usuario usuario = authService.usuarioActual();
        Pago p = new Pago();
        p.setFactura(f);
        p.setFechaPago(LocalDateTime.now());
        p.setValor(valor);
        p.setMetodoPago(metodo);
        p.setReferencia(referencia);
        p.setUsuario(usuario);
        p.setAnulado(Boolean.FALSE);
        f.getPagos().add(p);
        String anterior = f.getEstado();
        recalcularPagos(f);
        facturaRepository.save(f);
        registrar(f, "PAGO", anterior, f.getEstado(), "Pago " + metodo + " por " + Formato.moneda(valor)
                + (referencia == null ? "" : " (ref. " + referencia + ")"), usuario);
        return MiRespuestaRS.creado("Pago registrado. Estado: " + f.getEstado() + ". Saldo: " + Formato.moneda(f.getSaldo()) + ".", f.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS anularPago(Long pagoId, String motivo) {
        String m = Validar.texto(motivo, "motivo", 500);
        Validar.idValido(pagoId, "pagoId");
        Pago p = pagoRepository.findById(pagoId).orElseThrow(() -> new NotFoundException("El pago no existe."));
        Factura f = bloquear(p.getFactura().getId());
        if (Boolean.TRUE.equals(p.getAnulado())) {
            throw new ConflictException("El pago ya está anulado.");
        }
        if (Constantes.FAC_ANULADA.equals(f.getEstado())) {
            throw new ConflictException("La factura está anulada.");
        }
        Usuario usuario = authService.usuarioActual();
        Pago pago = f.getPagos().stream().filter(x -> x.getId().equals(pagoId)).findFirst().orElse(p);
        pago.setAnulado(Boolean.TRUE);
        pago.setMotivoAnulacion(m);
        pago.setUsuarioAnulacion(usuario);
        pago.setFechaAnulacion(LocalDateTime.now());
        String anterior = f.getEstado();
        recalcularPagos(f);
        facturaRepository.save(f);
        registrar(f, "ANULACION_PAGO", anterior, f.getEstado(), "Pago #" + pagoId + " por " + Formato.moneda(pago.getValor())
                + " anulado: " + m, usuario);
        return MiRespuestaRS.ok("Pago anulado. Saldo: " + Formato.moneda(f.getSaldo()) + ".", f.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS anular(Long facturaId, String motivo) {
        String m = Validar.texto(motivo, "motivo de anulación", 500);
        Factura f = bloquear(facturaId);
        if (Constantes.FAC_ANULADA.equals(f.getEstado())) {
            throw new ConflictException("La factura ya está anulada.");
        }
        boolean conPagos = f.getPagos().stream().anyMatch(p -> !Boolean.TRUE.equals(p.getAnulado()));
        if (conPagos) {
            throw new ConflictException("La factura tiene pagos vigentes. Anule (reverse) los pagos antes de anular la factura.");
        }
        Usuario usuario = authService.usuarioActual();
        String anterior = f.getEstado();
        f.setEstado(Constantes.FAC_ANULADA);
        f.setMotivoAnulacion(m);
        f.setUsuarioAnulacion(usuario);
        f.setFechaAnulacion(LocalDateTime.now());
        f.setSaldo(BigDecimal.ZERO.setScale(2));
        f.getDetalles().forEach(d -> d.setActivo(Boolean.FALSE));
        facturaRepository.save(f);
        registrar(f, "ANULACION", anterior, Constantes.FAC_ANULADA, m, usuario);
        return MiRespuestaRS.ok("Factura " + f.getNumero() + " anulada. Los registros se conservan; la cita puede facturarse de nuevo.", f.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Factura> listar(LocalDate fechaInicial, LocalDate fechaFinal, String estado, Long clienteId, Integer mascotaId) {
        List<Factura> base;
        if (clienteId != null) {
            base = facturaRepository.findByCliente_IdOrderByFechaGeneracionDesc(clienteId);
        } else if (mascotaId != null) {
            base = facturaRepository.findByMascota_MascotaIdOrderByFechaGeneracionDesc(mascotaId);
        } else {
            LocalDate ini = fechaInicial == null ? LocalDate.now().minusYears(5) : fechaInicial;
            LocalDate fin = fechaFinal == null ? LocalDate.now() : fechaFinal;
            if (ini.isAfter(fin)) {
                throw new BadRequestException("La fecha inicial no puede ser mayor a la final.");
            }
            base = facturaRepository.findByFechaGeneracionBetweenOrderByFechaGeneracionDesc(ini.atStartOfDay(),
                    fin.plusDays(1).atStartOfDay());
        }
        String est = Validar.vacio(estado) ? null : estado.trim().toUpperCase();
        return base.stream()
                .filter(f -> est == null || est.equals(f.getEstado()))
                .filter(f -> mascotaId == null || f.getMascota().getMascotaId().equals(mascotaId))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Factura consultar(Long facturaId) {
        Validar.idValido(facturaId, "facturaId");
        Factura f = facturaRepository.findById(facturaId).orElseThrow(() -> new NotFoundException("La factura no existe."));
        f.getDetalles().size();
        f.getPagos().size();
        return f;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacturaHistorial> historial(Long facturaId) {
        consultar(facturaId);
        return historialRepository.findByFacturaIdOrderByFechaAscIdAsc(facturaId);
    }

    // ------------------------------------------------------------------ cálculo

    private Cita citaFacturable(Long citaId) {
        Validar.idValido(citaId, "citaId");
        Cita c = citaRepository.findById(citaId).orElseThrow(() -> new NotFoundException("La cita no existe."));
        if (!Constantes.CITA_ATENDIDA.equals(c.getEstado())) {
            throw new ConflictException("Sólo se factura una cita atendida (estado actual: " + c.getEstado() + ").");
        }
        if (facturaRepository.existsByCita_IdAndEstadoNot(citaId, Constantes.FAC_ANULADA)) {
            throw new ConflictException("La atención ya tiene una factura vigente: no se cobra dos veces el mismo servicio.");
        }
        return c;
    }

    private Factura construir(Cita cita, BigDecimal pctDescuento) {
        Factura f = new Factura();
        f.setCita(cita);
        f.setCliente(cita.getCliente());
        f.setMascota(cita.getMascota());
        f.setMedico(cita.getMedico());
        f.setEspecializacion(cita.getMedico().getEspecializacion().getNombre());
        f.setFechaGeneracion(LocalDateTime.now());

        List<AtencionServicio> servicios = servicioRepository.findByCita_IdOrderByIdAsc(cita.getId());
        if (servicios.isEmpty() && cita.getTarifa() != null) {
            f.getDetalles().add(lineaServicio(f, cita.getTarifa(), 1, pctDescuento));
        }
        for (AtencionServicio s : servicios) {
            f.getDetalles().add(lineaServicio(f, s.getTarifa(), s.getCantidad(), pctDescuento));
        }
        if (f.getDetalles().isEmpty()) {
            throw new ConflictException("La atención no tiene servicios registrados para facturar.");
        }
        for (DespachoDetalle dd : despachoDetalleRepository.facturablesPorCita(cita.getId())) {
            f.getDetalles().add(lineaProducto(f, dd, pctDescuento));
        }
        totalizar(f);
        f.setTotalPagado(BigDecimal.ZERO.setScale(2));
        f.setSaldo(f.getTotal());
        return f;
    }

    private FacturaDetalle lineaServicio(Factura f, Tarifa t, int cantidad, BigDecimal pct) {
        FacturaDetalle d = new FacturaDetalle();
        d.setFactura(f);
        d.setTipoItem(Constantes.ITEM_SERVICIO);
        d.setTarifa(t);
        d.setDescripcion(t.getNombre());
        calcularLinea(d, cantidad, t.getValor(), t.getImpuesto(), pct);
        return d;
    }

    private FacturaDetalle lineaProducto(Factura f, DespachoDetalle dd, BigDecimal pct) {
        FacturaDetalle d = new FacturaDetalle();
        d.setFactura(f);
        d.setTipoItem(Constantes.ITEM_PRODUCTO);
        d.setMedicamento(dd.getMedicamento());
        d.setDespachoDetalleId(dd.getId());
        d.setDescripcion(dd.getMedicamento().getNombre() + " (lote " + dd.getLote().getNumeroLote() + ")");
        calcularLinea(d, dd.getCantidad(), dd.getPrecioVenta(), dd.getMedicamento().getImpuesto(), pct);
        return d;
    }

    /** bruto = cant x precio; descuento = bruto x %; base = bruto - desc; impuesto = base x % impuesto. */
    private void calcularLinea(FacturaDetalle d, int cantidad, BigDecimal precio, Impuesto imp, BigDecimal pct) {
        BigDecimal bruto = precio.multiply(BigDecimal.valueOf(cantidad)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal desc = bruto.multiply(pct).divide(CIEN, 0, RoundingMode.HALF_UP).setScale(2);
        BigDecimal base = bruto.subtract(desc);
        BigDecimal valorImp = base.multiply(imp.getPorcentaje()).divide(CIEN, 0, RoundingMode.HALF_UP).setScale(2);
        d.setCantidad(cantidad);
        d.setPrecioUnitario(precio.setScale(2, RoundingMode.HALF_UP));
        d.setPorcentajeDescuento(pct);
        d.setValorDescuento(desc);
        d.setSubtotal(base);
        d.setImpuestoCodigo(imp.getCodigo());
        d.setImpuestoPorcentaje(imp.getPorcentaje());
        d.setValorImpuesto(valorImp);
        d.setTotal(base.add(valorImp));
        d.setActivo(Boolean.TRUE);
    }

    private void totalizar(Factura f) {
        BigDecimal bruto = BigDecimal.ZERO;
        BigDecimal desc = BigDecimal.ZERO;
        BigDecimal imp = BigDecimal.ZERO;
        for (FacturaDetalle d : f.getDetalles()) {
            bruto = bruto.add(d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad())));
            desc = desc.add(d.getValorDescuento());
            imp = imp.add(d.getValorImpuesto());
        }
        f.setSubtotal(bruto.setScale(2, RoundingMode.HALF_UP));
        f.setTotalDescuento(desc.setScale(2, RoundingMode.HALF_UP));
        f.setTotalImpuestos(imp.setScale(2, RoundingMode.HALF_UP));
        f.setTotal(f.getSubtotal().subtract(f.getTotalDescuento()).add(f.getTotalImpuestos()));
    }

    /** Recalcula total pagado, saldo y estado a partir de los pagos vigentes. */
    private void recalcularPagos(Factura f) {
        BigDecimal pagado = f.getPagos().stream().filter(p -> !Boolean.TRUE.equals(p.getAnulado()))
                .map(Pago::getValor).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
        f.setTotalPagado(pagado);
        f.setSaldo(f.getTotal().subtract(pagado).max(BigDecimal.ZERO));
        if (f.getSaldo().signum() == 0) {
            f.setEstado(Constantes.FAC_PAGADA);
        } else if (pagado.signum() > 0) {
            f.setEstado(Constantes.FAC_PAGO_PARCIAL);
        } else {
            f.setEstado(Constantes.FAC_PENDIENTE);
        }
    }

    private BigDecimal porcentajeDescuentoActual(Factura f) {
        return f.getDetalles().stream().map(FacturaDetalle::getPorcentajeDescuento).findFirst()
                .orElse(BigDecimal.ZERO.setScale(2));
    }

    private Factura bloquear(Long facturaId) {
        Validar.idValido(facturaId, "facturaId");
        return bloqueos.bloquear(Factura.class, facturaId, "La factura no existe.");
    }

    private void registrar(Factura f, String accion, String anterior, String nuevo, String detalle, Usuario u) {
        FacturaHistorial h = new FacturaHistorial();
        h.setFacturaId(f.getId());
        h.setAccion(accion);
        h.setEstadoAnterior(anterior);
        h.setEstadoNuevo(nuevo);
        h.setDetalle(detalle.length() > 1000 ? detalle.substring(0, 1000) : detalle);
        h.setUsuario(u);
        h.setFecha(LocalDateTime.now());
        historialRepository.save(h);
    }
}
