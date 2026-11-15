package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.AtencionServicio;
import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.CitaHistorial;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.EstadoCita;
import com.uniminuto.clinica.entity.EstadoFactura;
import com.uniminuto.clinica.entity.EstadoFormula;
import com.uniminuto.clinica.entity.EstadoHistoria;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.entity.Servicio;
import com.uniminuto.clinica.entity.TipoServicio;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.exception.SinPermisoException;
import com.uniminuto.clinica.models.AgendaAtencionRs;
import com.uniminuto.clinica.models.AntecedenteRs;
import com.uniminuto.clinica.models.AtencionRq;
import com.uniminuto.clinica.models.AtencionRs;
import com.uniminuto.clinica.models.AtencionServicioRq;
import com.uniminuto.clinica.models.LineaCobroRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.AtencionServicioRepository;
import com.uniminuto.clinica.repository.CitaHistorialRepository;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.FacturaRepository;
import com.uniminuto.clinica.repository.FormulaRepository;
import com.uniminuto.clinica.repository.HistoriaClinicaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.repository.ServicioRepository;
import com.uniminuto.clinica.service.AtencionService;
import com.uniminuto.clinica.util.PdfDocumentos;
import com.uniminuto.clinica.util.UsuarioActual;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Atención médica de una cita. Reglas:
 * <ul>
 *     <li>Solo el veterinario de la cita la atiende, desde 30 minutos antes de su inicio.</li>
 *     <li>Al iniciar se crea la historia clínica de la cita y se agrega la consulta de la
 *         especialidad del veterinario con la tarifa vigente.</li>
 *     <li>Para finalizar se exigen motivo, síntomas y diagnóstico, al menos un servicio y que no
 *         queden fórmulas en borrador. Al finalizar la historia se cierra y la cita queda atendida.</li>
 *     <li>Una atención finalizada no se modifica; la prefactura muestra los servicios y los
 *         medicamentos formulados.</li>
 * </ul>
 */
@Service
public class AtencionServiceImpl implements AtencionService {

    /** Minutos antes del inicio de la cita en los que ya se puede iniciar la atención. */
    private static final int MINUTOS_ANTICIPACION = 30;

    /** Rol del veterinario. */
    private static final String ROL_VETERINARIO = "VETERINARIO";

    /** Repositorio de citas. */
    @Autowired
    private CitaRepository citaRepository;

    /** Historial de citas. */
    @Autowired
    private CitaHistorialRepository citaHistorialRepository;

    /** Historias clínicas (atenciones). */
    @Autowired
    private HistoriaClinicaRepository historiaRepository;

    /** Servicios prestados. */
    @Autowired
    private AtencionServicioRepository atencionServicioRepository;

    /** Tarifas. */
    @Autowired
    private ServicioRepository servicioRepository;

    /** Fórmulas. */
    @Autowired
    private FormulaRepository formulaRepository;

    /** Facturas. */
    @Autowired
    private FacturaRepository facturaRepository;

    /** Veterinarios. */
    @Autowired
    private MedicoRepository medicoRepository;

    /** Operaciones compartidas de fórmulas. */
    @Autowired
    private FormulaSoporte formulaSoporte;

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
    public List<AgendaAtencionRs> agenda(LocalDate fecha) {
        Medico medico = this.medicoDeSesion(usuarioActual.obtener(), true);
        LocalDate dia = fecha == null ? LocalDate.now() : fecha;
        List<AgendaAtencionRs> agenda = new ArrayList<>();
        Set<Long> citasIncluidas = new HashSet<>();
        // Atenciones abiertas de días anteriores: deben finalizarse.
        for (HistoriaClinica h : historiaRepository.findByMedico_IdAndEstadoAndCitaIsNotNullOrderByFechaHoraAsc(
                medico.getId(), EstadoHistoria.ABIERTA)) {
            if (h.getCita().getFechaHora().toLocalDate().isBefore(dia)) {
                agenda.add(this.convertirAgenda(h.getCita(), h));
                citasIncluidas.add(h.getCita().getCitaId());
            }
        }
        for (Cita c : citaRepository.buscarEnRango(medico.getId(), dia.atStartOfDay(), dia.plusDays(1).atStartOfDay())) {
            if (c.getEstado() == EstadoCita.CANCELADA || !citasIncluidas.add(c.getCitaId())) {
                continue;
            }
            agenda.add(this.convertirAgenda(c, historiaRepository.findByCita_CitaId(c.getCitaId()).orElse(null)));
        }
        return agenda;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public AtencionRs iniciar(Long citaId) {
        Usuario usuario = usuarioActual.obtener();
        Medico medico = this.medicoDeSesion(usuario, true);
        Cita cita = citaRepository.findById(citaId).orElseThrow(() -> new NotFoundException("La cita no existe"));
        if (!cita.getMedico().getId().equals(medico.getId())) {
            throw new SinPermisoException("La cita N.° " + citaId + " está asignada a otro veterinario");
        }
        HistoriaClinica existente = historiaRepository.findByCita_CitaId(citaId).orElse(null);
        if (existente != null) {
            return this.convertir(existente);
        }
        if (cita.getEstado() == EstadoCita.CANCELADA) {
            throw new ConflictException("La cita está cancelada");
        }
        if (cita.getFechaHora().isAfter(LocalDateTime.now().plusMinutes(MINUTOS_ANTICIPACION))) {
            throw new ConflictException("La atención se puede iniciar desde " + MINUTOS_ANTICIPACION
                    + " minutos antes de la cita (" + cita.getFechaHora().toLocalDate() + " "
                    + cita.getFechaHora().toLocalTime() + ")");
        }
        if (!Boolean.TRUE.equals(cita.getMascota().getCliente().getActivo())) {
            throw new ConflictException("El propietario está inactivo");
        }

        HistoriaClinica historia = new HistoriaClinica();
        historia.setMascota(cita.getMascota());
        historia.setMedico(medico);
        historia.setCita(cita);
        historia.setFechaHora(LocalDateTime.now().isBefore(cita.getFechaHora()) ? LocalDateTime.now() : cita.getFechaHora());
        historia.setMotivo(cita.getMotivo());
        historia.setEstado(EstadoHistoria.ABIERTA);
        historia.setFechaCreacion(LocalDateTime.now());
        historiaRepository.save(historia);

        // La consulta de la especialidad del veterinario se agrega sola, con la tarifa vigente.
        Servicio consulta = this.consultaDe(medico);
        if (consulta != null) {
            this.registrarServicio(historia, consulta, 1, null);
        }
        return this.convertir(historia);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public AtencionRs consultar(Long historiaId) {
        HistoriaClinica historia = this.buscar(historiaId);
        Medico propio = this.medicoDeSesion(usuarioActual.obtener(), false);
        if (propio != null && !propio.getId().equals(historia.getMedico().getId())) {
            throw new SinPermisoException("La atención pertenece a otro veterinario");
        }
        return this.convertir(historia);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardar(Long historiaId, AtencionRq rq) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos de la atención");
        }
        HistoriaClinica historia = this.buscarAbiertaPropia(historiaId);
        historia.setMotivo(Validaciones.obligatorio(rq.getMotivo(), "El motivo de consulta", 500));
        historia.setSintomas(Validaciones.opcional(rq.getSintomas(), "Los síntomas", 1000));
        historia.setDiagnostico(Validaciones.opcional(rq.getDiagnostico(), "El diagnóstico", 1000));
        historia.setObservaciones(Validaciones.opcional(rq.getObservaciones(), "Las observaciones", 1000));
        historia.setRecomendaciones(Validaciones.opcional(rq.getRecomendaciones(), "Las recomendaciones", 1000));
        historiaRepository.save(historia);
        return MiRespuestaRS.de(200, "Atención guardada");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS agregarServicio(Long historiaId, AtencionServicioRq rq) {
        if (rq == null || rq.getServicioId() == null) {
            throw new BadRequestException("Seleccione el servicio prestado");
        }
        int cantidad = rq.getCantidad() == null ? 1 : rq.getCantidad();
        if (cantidad < 1 || cantidad > 100) {
            throw new BadRequestException("La cantidad debe estar entre 1 y 100");
        }
        HistoriaClinica historia = this.buscarAbiertaPropia(historiaId);
        Servicio servicio = servicioRepository.findById(rq.getServicioId())
                .orElseThrow(() -> new NotFoundException("El servicio no existe"));
        if (!Boolean.TRUE.equals(servicio.getActivo())) {
            throw new ConflictException("El servicio " + servicio.getNombre() + " está inactivo");
        }
        if (atencionServicioRepository.existsByHistoria_HistoriaIdAndServicio_ServicioId(historiaId, servicio.getServicioId())) {
            throw new ConflictException(servicio.getNombre() + " ya está registrado en esta atención; no se cobra dos veces");
        }
        if (servicio.getTipo() == TipoServicio.CONSULTA && atencionServicioRepository
                .findByHistoria_HistoriaIdOrderByAtencionServicioIdAsc(historiaId).stream()
                .anyMatch(s -> s.getServicio().getTipo() == TipoServicio.CONSULTA)) {
            throw new ConflictException("La atención ya tiene una consulta registrada");
        }
        this.registrarServicio(historia, servicio, cantidad, Validaciones.opcional(rq.getObservacion(), "La observación", 255));
        return MiRespuestaRS.de(201, servicio.getNombre() + " agregado a la atención");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS quitarServicio(Long historiaId, Long atencionServicioId) {
        this.buscarAbiertaPropia(historiaId);
        AtencionServicio s = atencionServicioRepository.findById(atencionServicioId)
                .filter(x -> x.getHistoria().getHistoriaId().equals(historiaId))
                .orElseThrow(() -> new NotFoundException("El servicio no está registrado en esta atención"));
        atencionServicioRepository.delete(s);
        return MiRespuestaRS.de(200, s.getServicio().getNombre() + " quitado de la atención");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS finalizar(Long historiaId) {
        Usuario usuario = usuarioActual.obtener();
        HistoriaClinica historia = this.buscarAbiertaPropia(historiaId);
        List<String> faltantes = new ArrayList<>();
        if (historia.getMotivo() == null || historia.getMotivo().isBlank()) {
            faltantes.add("motivo de consulta");
        }
        if (historia.getSintomas() == null || historia.getSintomas().isBlank()) {
            faltantes.add("síntomas");
        }
        if (historia.getDiagnostico() == null || historia.getDiagnostico().isBlank()) {
            faltantes.add("diagnóstico");
        }
        if (!faltantes.isEmpty()) {
            throw new BadRequestException("Para finalizar registre: " + String.join(", ", faltantes)
                    + " (guarde la atención antes de finalizar)");
        }
        if (atencionServicioRepository.findByHistoria_HistoriaIdOrderByAtencionServicioIdAsc(historiaId).isEmpty()) {
            throw new BadRequestException("Registre al menos un servicio prestado");
        }
        List<Long> borradores = formulaRepository.findByHistoria_HistoriaIdOrderByFormulaIdAsc(historiaId).stream()
                .filter(f -> f.getEstado() == EstadoFormula.BORRADOR).map(FormulaMedica::getFormulaId).toList();
        if (!borradores.isEmpty()) {
            throw new ConflictException("Confirme o anule las fórmulas en borrador antes de finalizar (N.° " + borradores + ")");
        }

        LocalDateTime ahora = LocalDateTime.now();
        historia.setEstado(EstadoHistoria.CERRADA);
        historia.setFechaFinalizacion(ahora);
        historiaRepository.save(historia);

        Cita cita = historia.getCita();
        if (cita != null && cita.getEstado() != EstadoCita.ATENDIDA) {
            EstadoCita anterior = cita.getEstado();
            cita.setEstado(EstadoCita.ATENDIDA);
            cita.setFechaModificacion(ahora);
            citaRepository.save(cita);
            CitaHistorial h = new CitaHistorial();
            h.setCita(cita);
            h.setFecha(ahora);
            h.setUsuario(usuario);
            h.setAccion("ESTADO");
            h.setEstadoAnterior(anterior.name());
            h.setEstadoNuevo(EstadoCita.ATENDIDA.name());
            h.setObservacion("Atención finalizada (historia N.° " + historiaId + ")");
            citaHistorialRepository.save(h);
        }
        return MiRespuestaRS.de(200, "Atención finalizada; la cita quedó atendida y la prefactura está disponible");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public byte[] prefactura(Long historiaId) {
        AtencionRs atencion = this.consultar(historiaId);
        List<LineaCobroRs> lineas = new ArrayList<>(calculoCobro.servicios(historiaId));
        lineas.addAll(calculoCobro.medicamentosFormulados(historiaId));
        CalculoCobro.Totales t = calculoCobro.calcular(lineas, BigDecimal.ZERO);
        String[][] datos = {
            {"Atención", "N.° " + historiaId + (atencion.getCitaId() == null ? "" : " (cita N.° " + atencion.getCitaId() + ")")},
            {"Estado", "CERRADA".equals(atencion.getEstado()) ? "Finalizada" : "En curso"},
            {"Propietario", atencion.getClienteNombre()},
            {"Documento", atencion.getClienteDocumento()},
            {"Mascota", atencion.getMascotaNombre() + (atencion.getMascotaRaza() == null ? "" : " · " + atencion.getMascotaRaza())},
            {"Veterinario", atencion.getMedicoNombre()},
            {"Especialidad", atencion.getEspecialidad()},
            {"Fecha", atencion.getFechaHora().toLocalDate().toString()}
        };
        return pdf.documentoCobro("PREFACTURA", datos, lineas, t.subtotal(), t.descuento(), t.iva(), t.total(),
                List.of(), "Documento informativo, no válido como factura. Los medicamentos se facturarán según "
                        + "las cantidades efectivamente entregadas por despacho.");
    }

    // ===================== Utilidades =====================

    /**
     * Registra un servicio prestado congelando la tarifa vigente.
     */
    private void registrarServicio(HistoriaClinica historia, Servicio servicio, int cantidad, String observacion) {
        AtencionServicio s = new AtencionServicio();
        s.setHistoria(historia);
        s.setServicio(servicio);
        s.setCantidad(cantidad);
        s.setValorUnitario(servicio.getValor());
        s.setIvaPorcentaje(servicio.getIvaPorcentaje());
        s.setObservacion(observacion);
        s.setFechaCreacion(LocalDateTime.now());
        atencionServicioRepository.save(s);
    }

    /**
     * Consulta activa de la especialidad del veterinario (o la general si no hay).
     */
    private Servicio consultaDe(Medico medico) {
        if (medico.getEspecializacion() != null) {
            Servicio s = servicioRepository.findFirstByTipoAndEspecializacion_IdAndActivoTrue(
                    TipoServicio.CONSULTA, medico.getEspecializacion().getId()).orElse(null);
            if (s != null) {
                return s;
            }
        }
        return servicioRepository.findFirstByTipoAndEspecializacionIsNullAndActivoTrue(TipoServicio.CONSULTA).orElse(null);
    }

    /**
     * Busca una atención abierta del veterinario de la sesión.
     */
    private HistoriaClinica buscarAbiertaPropia(Long historiaId) {
        HistoriaClinica historia = this.buscar(historiaId);
        Medico medico = this.medicoDeSesion(usuarioActual.obtener(), true);
        if (!medico.getId().equals(historia.getMedico().getId())) {
            throw new SinPermisoException("La atención pertenece a otro veterinario");
        }
        if (historia.getEstado() != EstadoHistoria.ABIERTA) {
            throw new ConflictException("La atención ya fue finalizada y no se puede modificar");
        }
        return historia;
    }

    private HistoriaClinica buscar(Long historiaId) {
        return historiaRepository.findById(historiaId)
                .orElseThrow(() -> new NotFoundException("La atención no existe"));
    }

    /**
     * Médico enlazado al usuario si es veterinario.
     *
     * @param obligatorio si debe serlo (si no, devuelve null para otros perfiles).
     */
    private Medico medicoDeSesion(Usuario usuario, boolean obligatorio) {
        if (!ROL_VETERINARIO.equals(usuario.getRol())) {
            if (obligatorio) {
                throw new SinPermisoException("Solo el veterinario puede atender citas");
            }
            return null;
        }
        return medicoRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new ConflictException(
                        "Su usuario no está enlazado a un médico veterinario; solicite al administrador que lo asocie"));
    }

    /**
     * Fila de la agenda.
     */
    private AgendaAtencionRs convertirAgenda(Cita c, HistoriaClinica h) {
        AgendaAtencionRs rs = new AgendaAtencionRs();
        rs.setCitaId(c.getCitaId());
        rs.setInicio(c.getFechaHora());
        rs.setFin(c.getFechaHoraFin());
        rs.setMascotaNombre(c.getMascota().getNombreMascota());
        Cliente cliente = c.getMascota().getCliente();
        rs.setClienteNombre(cliente.getNombres() + " " + cliente.getApellidos());
        rs.setMotivo(c.getMotivo());
        rs.setEstadoCita(c.getEstado().name());
        rs.setHistoriaId(h == null ? null : h.getHistoriaId());
        rs.setEstadoAtencion(h == null ? "SIN_INICIAR" : h.getEstado() == EstadoHistoria.ABIERTA ? "EN_CURSO" : "FINALIZADA");
        return rs;
    }

    /**
     * Atención completa con antecedentes, servicios y fórmulas.
     */
    private AtencionRs convertir(HistoriaClinica h) {
        Mascota mascota = h.getMascota();
        Cliente cliente = mascota.getCliente();
        Medico medico = h.getMedico();
        AtencionRs rs = new AtencionRs();
        rs.setHistoriaId(h.getHistoriaId());
        rs.setCitaId(h.getCita() == null ? null : h.getCita().getCitaId());
        rs.setCitaInicio(h.getCita() == null ? null : h.getCita().getFechaHora());
        rs.setEstado(h.getEstado().name());
        rs.setFechaHora(h.getFechaHora());
        rs.setFechaFinalizacion(h.getFechaFinalizacion());
        rs.setMotivo(h.getMotivo());
        rs.setSintomas(h.getSintomas());
        rs.setDiagnostico(h.getDiagnostico());
        rs.setObservaciones(h.getObservaciones());
        rs.setRecomendaciones(h.getRecomendaciones());
        rs.setMascotaId(mascota.getMascotaId());
        rs.setMascotaNombre(mascota.getNombreMascota());
        rs.setMascotaEdad(mascota.getEdad());
        rs.setMascotaRaza(mascota.getRaza() == null ? null
                : mascota.getRaza().getNombre() + " (" + mascota.getRaza().getEspecie() + ")");
        rs.setClienteId(cliente.getClienteId());
        rs.setClienteNombre(cliente.getNombres() + " " + cliente.getApellidos());
        rs.setClienteDocumento(cliente.getTipoDocumento() + " " + cliente.getNumeroDocumento());
        rs.setClienteTelefono(cliente.getTelefono());
        rs.setMedicoId(medico.getId());
        rs.setMedicoNombre(medico.getNombres() + " " + medico.getApellidos());
        rs.setEspecialidad(medico.getEspecializacion() == null ? null : medico.getEspecializacion().getNombre());
        rs.setAntecedentes(historiaRepository
                .findByMascota_MascotaIdAndHistoriaIdNotOrderByFechaHoraDesc(mascota.getMascotaId(), h.getHistoriaId())
                .stream().map(a -> {
                    AntecedenteRs ant = new AntecedenteRs();
                    ant.setHistoriaId(a.getHistoriaId());
                    ant.setFechaHora(a.getFechaHora());
                    ant.setMedicoNombre(a.getMedico().getNombres() + " " + a.getMedico().getApellidos());
                    ant.setMotivo(a.getMotivo());
                    ant.setSintomas(a.getSintomas());
                    ant.setDiagnostico(a.getDiagnostico());
                    ant.setRecomendaciones(a.getRecomendaciones());
                    return ant;
                }).toList());
        List<LineaCobroRs> servicios = calculoCobro.servicios(h.getHistoriaId());
        rs.setTotalServicios(calculoCobro.calcular(servicios, BigDecimal.ZERO).total());
        rs.setServicios(servicios);
        rs.setFormulas(formulaRepository.findByHistoria_HistoriaIdOrderByFormulaIdAsc(h.getHistoriaId()).stream()
                .map(formulaSoporte::resumen).toList());
        facturaRepository.findFirstByHistoria_HistoriaIdAndEstadoNot(h.getHistoriaId(), EstadoFactura.ANULADA).ifPresent(f -> {
            rs.setFacturaId(f.getFacturaId());
            rs.setFacturaNumero(f.getNumero());
        });
        return rs;
    }
}
