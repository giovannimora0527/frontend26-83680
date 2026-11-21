package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Despacho;
import com.uniminuto.clinica.entity.DespachoDetalle;
import com.uniminuto.clinica.entity.FormulaEstadoHistorial;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.FormulaMedicaDetalle;
import com.uniminuto.clinica.entity.LoteMedicamento;
import com.uniminuto.clinica.entity.MovimientoInventario;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.DespachoRq;
import com.uniminuto.clinica.models.DispensacionRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PreparacionRs;
import com.uniminuto.clinica.repository.DespachoDetalleRepository;
import com.uniminuto.clinica.repository.DespachoRepository;
import com.uniminuto.clinica.repository.FacturaDetalleRepository;
import com.uniminuto.clinica.repository.FormulaEstadoHistorialRepository;
import com.uniminuto.clinica.repository.FormulaMedicaRepository;
import com.uniminuto.clinica.repository.LoteMedicamentoRepository;
import com.uniminuto.clinica.repository.MovimientoInventarioRepository;
import com.uniminuto.clinica.service.AuthService;
import com.uniminuto.clinica.service.DespachoService;
import com.uniminuto.clinica.utils.Constantes;
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Despacho y dispensación (perfil DESPACHO_MEDICO).
 * Reglas: el inventario sólo se descuenta al confirmar; no se dispensan lotes
 * vencidos ni cantidades mayores a las existencias o a lo pendiente; se permiten
 * entregas parciales; cada salida queda ligada al despacho y a la fórmula; una
 * misma confirmación no se aplica dos veces (clave de idempotencia); las
 * dispensaciones confirmadas no se borran: se revierten con motivo y trazabilidad.
 * El personal de despacho no puede modificar dosis, indicaciones ni cantidades prescritas.
 */
@Service
public class DespachoServiceImpl implements DespachoService {

    @Autowired
    private FormulaMedicaRepository formulaRepository;

    @Autowired
    private FormulaEstadoHistorialRepository estadoHistorialRepository;

    @Autowired
    private DespachoRepository despachoRepository;

    @Autowired
    private DespachoDetalleRepository despachoDetalleRepository;

    @Autowired
    private LoteMedicamentoRepository loteRepository;

    @Autowired
    private MovimientoInventarioRepository movimientoRepository;

    @Autowired
    private FacturaDetalleRepository facturaDetalleRepository;

    @Autowired
    private InventarioMotor inventarioMotor;

    @Autowired
    private FormulaTrazabilidad trazabilidad;

    @Autowired
    private AuthService authService;

    @Autowired
    private Bloqueos bloqueos;

    @Override
    @Transactional(readOnly = true)
    public List<FormulaMedica> bandeja(String numero, String propietario, String mascota, LocalDate fecha, String estado) {
        List<String> estados = Validar.vacio(estado) ? Constantes.DESP_ESTADOS_BANDEJA
                : List.of(Validar.enLista(estado, Constantes.DESP_ESTADOS_BANDEJA, "estado de despacho"));
        String num = minus(numero);
        String prop = minus(propietario);
        String masc = minus(mascota);
        List<FormulaMedica> lista = formulaRepository
                .findByEstadoAndEstadoDespachoInOrderByFechaConfirmacionAsc(Constantes.FORMULA_CONFIRMADA, estados).stream()
                .filter(f -> num == null || (f.getNumero() != null && f.getNumero().toLowerCase().contains(num))
                        || String.valueOf(f.getId()).equals(num))
                .filter(f -> prop == null || (f.getCita().getCliente().getNombres() + " " + f.getCita().getCliente().getApellidos()
                        + " " + f.getCita().getCliente().getNumeroDocumento()).toLowerCase().contains(prop))
                .filter(f -> masc == null || f.getMascota().getNombreMascota().toLowerCase().contains(masc))
                .filter(f -> fecha == null || fecha.equals(f.getFechaEmision()))
                .toList();
        lista.forEach(f -> f.getDetalles().size());
        return lista;
    }

    @Override
    @Transactional
    public PreparacionRs preparar(Long formulaId) {
        FormulaMedica f = bloquearFormula(formulaId);
        validarDespachable(f);
        if (!Constantes.DESP_EN_PREPARACION.equals(f.getEstadoDespacho())) {
            String anterior = f.getEstadoDespacho();
            f.setEstadoDespacho(Constantes.DESP_EN_PREPARACION);
            formulaRepository.save(f);
            trazabilidad.registrar(f, anterior, Constantes.DESP_EN_PREPARACION, "Verificación de medicamentos iniciada",
                    authService.usuarioActual());
        }
        LocalDate hoy = LocalDate.now();
        List<PreparacionRs.Item> items = new ArrayList<>();
        for (FormulaMedicaDetalle d : f.getDetalles()) {
            int pendiente = d.getCantidadPendiente();
            List<LoteMedicamento> lotes = loteRepository.conExistenciaFefo(d.getMedicamento().getId());
            int vigente = 0;
            int vencido = 0;
            List<PreparacionRs.Lote> vistaLotes = new ArrayList<>();
            int porAsignar = pendiente;
            // FEFO: primero los lotes vigentes que vencen antes
            for (LoteMedicamento l : lotes) {
                boolean estaVencido = l.estaVencido(hoy);
                int sugerida = 0;
                if (estaVencido) {
                    vencido += l.getCantidadDisponible();
                } else {
                    vigente += l.getCantidadDisponible();
                    sugerida = Math.min(porAsignar, l.getCantidadDisponible());
                    porAsignar -= sugerida;
                }
                boolean proximo = !estaVencido && l.getFechaVencimiento() != null
                        && ChronoUnit.DAYS.between(hoy, l.getFechaVencimiento()) <= Constantes.DIAS_PROXIMO_VENCER;
                vistaLotes.add(new PreparacionRs.Lote(l.getId(), l.getNumeroLote(), l.getFechaVencimiento(),
                        l.getCantidadDisponible(), estaVencido, proximo, sugerida));
            }
            items.add(new PreparacionRs.Item(d.getId(), d.getMedicamento().getId(), d.getMedicamento().getCodigo(),
                    d.getMedicamento().getNombre(), d.getMedicamento().getUnidadMedida(), d.getDosis(),
                    d.getFrecuenciaHoras(), d.getDuracionDias(), d.getViaAdministracion(), d.getIndicaciones(),
                    d.getCantidadPrescrita(), d.getCantidadDespachada(), pendiente, vigente, vencido,
                    vigente >= pendiente, vistaLotes));
        }
        return new PreparacionRs(f, UUID.randomUUID().toString(), items);
    }

    @Override
    @Transactional
    public MiRespuestaRS confirmar(DespachoRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información del despacho es obligatoria.");
        }
        String clave = Validar.texto(rq.getClaveIdempotencia(), "clave de idempotencia", 64);
        Optional<Despacho> previo = despachoRepository.findByClaveIdempotencia(clave);
        if (previo.isPresent()) {
            return MiRespuestaRS.ok("Este despacho ya había sido registrado (" + previo.get().getNumero()
                    + "); no se descontó nuevamente el inventario.", previo.get().getId());
        }
        FormulaMedica f = bloquearFormula(rq.getFormulaId());
        validarDespachable(f);
        if (rq.getItems() == null || rq.getItems().isEmpty()) {
            throw new BadRequestException("Indique al menos un medicamento y lote a entregar.");
        }
        Map<Long, FormulaMedicaDetalle> detalles = f.getDetalles().stream()
                .collect(Collectors.toMap(FormulaMedicaDetalle::getId, d -> d));
        Map<Long, Integer> porDetalle = new HashMap<>();
        Map<Long, LoteMedicamento> lotes = new HashMap<>();
        for (DespachoRq.Item it : rq.getItems()) {
            Validar.idValido(it.getFormulaDetalleId(), "formulaDetalleId");
            Validar.idValido(it.getLoteId(), "loteId");
            Validar.entero(it.getCantidad(), "cantidad a entregar", 1, 100_000);
            FormulaMedicaDetalle d = detalles.get(it.getFormulaDetalleId());
            if (d == null) {
                throw new BadRequestException("El medicamento " + it.getFormulaDetalleId() + " no pertenece a la fórmula.");
            }
            LoteMedicamento lote = loteRepository.findById(it.getLoteId())
                    .orElseThrow(() -> new NotFoundException("El lote " + it.getLoteId() + " no existe."));
            if (!lote.getMedicamento().getId().equals(d.getMedicamento().getId())) {
                throw new BadRequestException("El lote " + lote.getNumeroLote() + " no corresponde a " + d.getMedicamento().getNombre() + ".");
            }
            if (lote.estaVencido(LocalDate.now())) {
                throw new ConflictException("No se permite dispensar el lote vencido " + lote.getNumeroLote() + ".");
            }
            lotes.put(lote.getId(), lote);
            porDetalle.merge(d.getId(), it.getCantidad(), Integer::sum);
        }
        for (Map.Entry<Long, Integer> e : porDetalle.entrySet()) {
            FormulaMedicaDetalle d = detalles.get(e.getKey());
            if (e.getValue() > d.getCantidadPendiente()) {
                throw new ConflictException("Para " + d.getMedicamento().getNombre() + " se intenta entregar " + e.getValue()
                        + " y sólo quedan " + d.getCantidadPendiente() + " pendientes de lo prescrito.");
            }
        }

        Usuario usuario = authService.usuarioActual();
        Despacho desp = new Despacho();
        desp.setFormula(f);
        desp.setClaveIdempotencia(clave);
        desp.setEstadoResultante(f.getEstadoDespacho());
        desp.setObservaciones(Validar.textoOpcional(rq.getObservaciones(), "observaciones", 1000));
        desp.setUsuario(usuario);
        desp.setFechaDespacho(LocalDateTime.now());
        desp.setRevertido(Boolean.FALSE);
        despachoRepository.save(desp);
        desp.setNumero(String.format("DSP-%06d", desp.getId()));

        // Orden fijo (medicamento, lote) para tomar los bloqueos siempre en el mismo orden
        List<DespachoRq.Item> ordenados = new ArrayList<>(rq.getItems());
        ordenados.sort(Comparator.comparing((DespachoRq.Item it) -> lotes.get(it.getLoteId()).getMedicamento().getId())
                .thenComparing(DespachoRq.Item::getLoteId));
        for (DespachoRq.Item it : ordenados) {
            FormulaMedicaDetalle d = detalles.get(it.getFormulaDetalleId());
            DespachoDetalle dd = new DespachoDetalle();
            dd.setDespacho(desp);
            dd.setFormulaDetalle(d);
            dd.setMedicamento(d.getMedicamento());
            dd.setLote(lotes.get(it.getLoteId()));
            dd.setCantidad(it.getCantidad());
            dd.setPrecioVenta(d.getMedicamento().getPrecioVenta());
            despachoDetalleRepository.save(dd);
            desp.getDetalles().add(dd);
            inventarioMotor.salidaLote(it.getLoteId(), it.getCantidad(), usuario,
                    new InventarioMotor.Referencia(Constantes.CONCEPTO_DISPENSACION, f.getId(), desp.getId(), dd.getId(),
                            null, "Dispensación " + desp.getNumero() + " - fórmula " + f.getNumero()));
            d.setCantidadDespachada(d.getCantidadDespachada() + it.getCantidad());
        }
        String anterior = f.getEstadoDespacho();
        String nuevo = estadoSegunPendientes(f);
        f.setEstadoDespacho(nuevo);
        f.setFechaActualizacionRegistro(LocalDateTime.now());
        formulaRepository.save(f);
        desp.setEstadoResultante(nuevo);
        despachoRepository.save(desp);
        trazabilidad.registrar(f, anterior, nuevo, "Despacho " + desp.getNumero() + " confirmado ("
                + desp.getDetalles().size() + " línea(s))", usuario);
        return MiRespuestaRS.creado("Despacho " + desp.getNumero() + " confirmado. Estado de la fórmula: " + nuevo + ".", desp.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS marcarPendienteDisponibilidad(Long formulaId, String observacion) {
        FormulaMedica f = bloquearFormula(formulaId);
        validarDespachable(f);
        String anterior = f.getEstadoDespacho();
        f.setEstadoDespacho(Constantes.DESP_PENDIENTE_DISPONIBILIDAD);
        formulaRepository.save(f);
        trazabilidad.registrar(f, anterior, Constantes.DESP_PENDIENTE_DISPONIBILIDAD,
                Validar.vacio(observacion) ? "Sin existencias suficientes para entregar" : observacion.trim(),
                authService.usuarioActual());
        return MiRespuestaRS.ok("Fórmula marcada como pendiente por disponibilidad.", f.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS cancelar(Long formulaId, String motivo) {
        String m = Validar.texto(motivo, "motivo de cancelación", 500);
        if (m.length() < 10) {
            throw new BadRequestException("Describa el motivo de la cancelación (mínimo 10 caracteres).");
        }
        FormulaMedica f = bloquearFormula(formulaId);
        validarDespachable(f);
        String anterior = f.getEstadoDespacho();
        f.setEstadoDespacho(Constantes.DESP_CANCELADO);
        formulaRepository.save(f);
        trazabilidad.registrar(f, anterior, Constantes.DESP_CANCELADO, "Despacho cancelado: " + m, authService.usuarioActual());
        return MiRespuestaRS.ok("Despacho de la fórmula cancelado. Lo ya entregado se conserva en el historial.", f.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS revertir(Long despachoId, String motivo) {
        String m = Validar.texto(motivo, "motivo de reversión", 500);
        if (m.length() < 10) {
            throw new BadRequestException("Describa el motivo de la reversión (mínimo 10 caracteres).");
        }
        Validar.idValido(despachoId, "despachoId");
        Despacho desp = despachoRepository.findById(despachoId)
                .orElseThrow(() -> new NotFoundException("El despacho no existe."));
        FormulaMedica f = bloquearFormula(desp.getFormula().getId());
        if (Boolean.TRUE.equals(desp.getRevertido())) {
            throw new ConflictException("El despacho " + desp.getNumero() + " ya fue revertido.");
        }
        List<Long> ids = desp.getDetalles().stream().map(DespachoDetalle::getId).toList();
        if (!ids.isEmpty() && facturaDetalleRepository.contarFacturados(ids) > 0) {
            throw new ConflictException("Los productos de este despacho ya fueron facturados; anule la factura antes de revertir.");
        }
        Usuario usuario = authService.usuarioActual();
        Map<Long, FormulaMedicaDetalle> detalles = f.getDetalles().stream()
                .collect(Collectors.toMap(FormulaMedicaDetalle::getId, d -> d));
        List<DespachoDetalle> ordenados = new ArrayList<>(desp.getDetalles());
        ordenados.sort(Comparator.comparing((DespachoDetalle dd) -> dd.getMedicamento().getId())
                .thenComparing(dd -> dd.getLote().getId()));
        for (DespachoDetalle dd : ordenados) {
            inventarioMotor.reingresoLote(dd.getLote().getId(), dd.getCantidad(), usuario,
                    new InventarioMotor.Referencia(Constantes.CONCEPTO_REVERSION, f.getId(), desp.getId(), dd.getId(),
                            null, "Reversión de " + desp.getNumero() + ": " + m));
            FormulaMedicaDetalle d = detalles.get(dd.getFormulaDetalleId());
            d.setCantidadDespachada(d.getCantidadDespachada() - dd.getCantidad());
        }
        desp.setRevertido(Boolean.TRUE);
        desp.setMotivoReversion(m);
        desp.setUsuarioReversion(usuario);
        desp.setFechaReversion(LocalDateTime.now());
        despachoRepository.save(desp);
        String anterior = f.getEstadoDespacho();
        boolean nadaEntregado = f.getDetalles().stream().allMatch(d -> d.getCantidadDespachada() == 0);
        String nuevo = Constantes.DESP_CANCELADO.equals(anterior) ? anterior
                : (nadaEntregado ? Constantes.DESP_PENDIENTE : Constantes.DESP_PARCIAL);
        f.setEstadoDespacho(nuevo);
        formulaRepository.save(f);
        trazabilidad.registrar(f, anterior, nuevo, "Reversión de " + desp.getNumero() + ": " + m, usuario);
        return MiRespuestaRS.ok("Despacho " + desp.getNumero() + " revertido; las unidades regresaron a sus lotes.", desp.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public Despacho consultar(Long despachoId) {
        Validar.idValido(despachoId, "despachoId");
        Despacho d = despachoRepository.findById(despachoId).orElseThrow(() -> new NotFoundException("El despacho no existe."));
        d.getDetalles().size();
        d.getFormula().getDetalles().size();
        return d;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Despacho> historial(LocalDate fechaInicial, LocalDate fechaFinal, String texto) {
        LocalDate ini = fechaInicial == null ? LocalDate.now().minusMonths(3) : fechaInicial;
        LocalDate fin = fechaFinal == null ? LocalDate.now() : fechaFinal;
        if (ini.isAfter(fin)) {
            throw new BadRequestException("La fecha inicial no puede ser mayor a la final.");
        }
        String q = minus(texto);
        List<Despacho> lista = despachoRepository.findByFechaDespachoBetweenOrderByFechaDespachoDesc(ini.atStartOfDay(),
                fin.plusDays(1).atStartOfDay()).stream().filter(d -> q == null || coincide(d, q)).toList();
        lista.forEach(d -> {
            d.getDetalles().size();
            d.getFormula().getDetalles().size();
        });
        return lista;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Despacho> despachosDeFormula(Long formulaId) {
        Validar.idValido(formulaId, "formulaId");
        List<Despacho> lista = despachoRepository.findByFormula_IdOrderByFechaDespachoAsc(formulaId);
        lista.forEach(d -> d.getDetalles().size());
        return lista;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FormulaEstadoHistorial> historialEstados(Long formulaId) {
        Validar.idValido(formulaId, "formulaId");
        return estadoHistorialRepository.findByFormulaIdOrderByFechaAscIdAsc(formulaId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DispensacionRs> dispensacionesPorMedicamento(Long medicamentoId) {
        Validar.idValido(medicamentoId, "medicamentoId");
        List<DispensacionRs> salida = new ArrayList<>();
        for (DespachoDetalle dd : despachoDetalleRepository.porMedicamento(medicamentoId)) {
            Despacho d = dd.getDespacho();
            FormulaMedica f = d.getFormula();
            Long movimientoId = movimientoRepository.findByDespachoIdOrderByIdAsc(d.getId()).stream()
                    .filter(mv -> dd.getId().equals(mv.getDespachoDetalleId()) && Constantes.MOV_SALIDA.equals(mv.getTipo()))
                    .map(MovimientoInventario::getId).findFirst().orElse(null);
            salida.add(new DispensacionRs(d.getId(), d.getNumero(), d.getFechaDespacho(), f.getNumero(),
                    f.getMascota().getNombreMascota(),
                    f.getCita().getCliente().getNombres() + " " + f.getCita().getCliente().getApellidos(),
                    f.getMedico().nombreCompleto(), d.getUsuario().getNombreCompleto(), dd.getMedicamento().getNombre(),
                    dd.getLote().getNumeroLote(), dd.getLote().getFechaVencimiento(), dd.getCantidad(),
                    Boolean.TRUE.equals(d.getRevertido()), movimientoId));
        }
        return salida;
    }

    // ------------------------------------------------------------------ apoyo

    /** DESPACHADO si no queda nada; PENDIENTE_DISPONIBILIDAD si lo pendiente no tiene existencias; si no, PARCIAL. */
    private String estadoSegunPendientes(FormulaMedica f) {
        boolean todoEntregado = f.getDetalles().stream().allMatch(d -> d.getCantidadPendiente() == 0);
        if (todoEntregado) {
            return Constantes.DESP_DESPACHADO;
        }
        LocalDate hoy = LocalDate.now();
        boolean faltaInventario = f.getDetalles().stream().filter(d -> d.getCantidadPendiente() > 0).anyMatch(d -> {
            int vigente = loteRepository.conExistenciaFefo(d.getMedicamento().getId()).stream()
                    .filter(l -> !l.estaVencido(hoy)).mapToInt(LoteMedicamento::getCantidadDisponible).sum();
            return vigente < d.getCantidadPendiente();
        });
        return faltaInventario ? Constantes.DESP_PENDIENTE_DISPONIBILIDAD : Constantes.DESP_PARCIAL;
    }

    private void validarDespachable(FormulaMedica f) {
        if (!Constantes.FORMULA_CONFIRMADA.equals(f.getEstado())) {
            throw new ConflictException("La fórmula no está confirmada por el veterinario (estado " + f.getEstado() + ").");
        }
        if (!Constantes.DESP_ESTADOS_BANDEJA.contains(f.getEstadoDespacho())) {
            throw new ConflictException("La fórmula está en estado " + f.getEstadoDespacho() + " y no admite despachos.");
        }
    }

    private FormulaMedica bloquearFormula(Long formulaId) {
        Validar.idValido(formulaId, "formulaId");
        FormulaMedica f = bloqueos.bloquear(FormulaMedica.class, formulaId, "La fórmula médica no existe.");
        f.getDetalles().size();
        return f;
    }

    private static boolean coincide(Despacho d, String q) {
        FormulaMedica f = d.getFormula();
        String texto = (d.getNumero() + " " + f.getNumero() + " " + f.getMascota().getNombreMascota() + " "
                + f.getCita().getCliente().getNombres() + " " + f.getCita().getCliente().getApellidos() + " "
                + d.getUsuario().getNombreCompleto()).toLowerCase();
        return texto.contains(q);
    }

    private static String minus(String s) {
        return Validar.vacio(s) ? null : s.trim().toLowerCase();
    }
}
