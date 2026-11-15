package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.CitaHistorial;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.EstadoCita;
import com.uniminuto.clinica.entity.EstadoCitaCatalogo;
import com.uniminuto.clinica.entity.HorarioMedico;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.exception.SinPermisoException;
import com.uniminuto.clinica.models.CitaFiltroRq;
import com.uniminuto.clinica.models.CitaHistorialRs;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.CitaRs;
import com.uniminuto.clinica.models.EstadoCitaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.ReprogramarCitaRq;
import com.uniminuto.clinica.repository.CitaHistorialRepository;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.CitaSpecification;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.repository.EstadoCitaRepository;
import com.uniminuto.clinica.repository.HorarioMedicoRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.CitaService;
import com.uniminuto.clinica.util.ExcelDocumentos;
import com.uniminuto.clinica.util.Paginacion;
import com.uniminuto.clinica.util.UsuarioActual;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Reglas de negocio de las citas médicas. Todas se validan en el backend:
 * <ul>
 *     <li>Cada cita tiene inicio y fin; un veterinario no puede tener dos citas que se crucen,
 *         ni una mascota dos citas simultáneas (las canceladas no ocupan horario).</li>
 *     <li>No se asignan citas a veterinarios inactivos ni fuera de su horario de disponibilidad.</li>
 *     <li>Las citas no se borran: se cancelan con motivo y conservan su historial de cambios.</li>
 *     <li>El veterinario solo ve en su calendario y solo modifica sus propias citas.</li>
 * </ul>
 */
@Service
public class CitaServiceImpl implements CitaService {

    /**
     * Duración mínima de una cita en minutos.
     */
    private static final int DURACION_MINIMA = 10;

    /**
     * Duración máxima de una cita en minutos.
     */
    private static final int DURACION_MAXIMA = 240;

    /**
     * Longitud máxima del motivo de la consulta.
     */
    private static final int LONGITUD_MAXIMA_MOTIVO = 500;

    /**
     * Días máximos que puede abarcar una consulta del calendario.
     */
    private static final int DIAS_MAXIMOS_CALENDARIO = 62;

    /**
     * Días máximos del reporte en Excel.
     */
    private static final int DIAS_MAXIMOS_REPORTE = 366;

    /**
     * Valor usado como "cita a ignorar" cuando se valida una cita nueva.
     */
    private static final Long SIN_CITA = -1L;

    /**
     * Rol del veterinario.
     */
    private static final String ROL_VETERINARIO = "VETERINARIO";

    /**
     * Columnas por las que se puede ordenar y su campo real.
     */
    private static final Map<String, String> CAMPOS_ORDEN = Map.of(
            "fecha", "fechaHora",
            "hora", "fechaHora",
            "cliente", "mascota.cliente.nombres",
            "mascota", "mascota.nombreMascota",
            "medico", "medico.nombres",
            "estado", "estado");

    /**
     * Repositorio de citas.
     */
    @Autowired
    private CitaRepository citaRepository;

    /**
     * Repositorio del historial de citas.
     */
    @Autowired
    private CitaHistorialRepository historialRepository;

    /**
     * Repositorio del catálogo de estados.
     */
    @Autowired
    private EstadoCitaRepository estadoCitaRepository;

    /**
     * Repositorio de clientes.
     */
    @Autowired
    private ClienteRepository clienteRepository;

    /**
     * Repositorio de mascotas.
     */
    @Autowired
    private MascotaRepository mascotaRepository;

    /**
     * Repositorio de veterinarios.
     */
    @Autowired
    private MedicoRepository medicoRepository;

    /**
     * Repositorio de horarios.
     */
    @Autowired
    private HorarioMedicoRepository horarioRepository;

    /**
     * Usuario autenticado.
     */
    @Autowired
    private UsuarioActual usuarioActual;

    /**
     * Generador de Excel.
     */
    @Autowired
    private ExcelDocumentos excel;

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<CitaRs> listarCitas(CitaFiltroRq filtro) {
        Paginacion.validarRango(filtro.getDesde(), filtro.getHasta());
        EstadoCita estado = filtro.getEstado() == null || filtro.getEstado().isBlank()
                ? null : this.convertirEstado(filtro.getEstado());
        return PaginaRs.desde(citaRepository
                .findAll(CitaSpecification.conFiltros(filtro.getTexto(), estado, filtro.getMedicoId(),
                                filtro.getClienteId(), filtro.getMascotaId(), filtro.getDesde(), filtro.getHasta()),
                        Paginacion.crear(filtro.getPage(), filtro.getSize(), filtro.getOrden(),
                                filtro.getDireccion(), CAMPOS_ORDEN, "fechaHora", "citaId"))
                .map(this::convertirARespuesta));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public CitaRs consultarCita(Long citaId) {
        return this.convertirARespuesta(this.buscarCita(citaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarCita(CitaRq citaRq) {
        this.validarDatosObligatorios(citaRq, true);
        Usuario usuario = usuarioActual.obtener();

        // El veterinario solo agenda en su propio calendario.
        Long medicoId = citaRq.getMedicoId();
        Medico propio = this.medicoDeSesion(usuario);
        if (propio != null) {
            medicoId = propio.getId();
        } else if (medicoId == null) {
            throw new BadRequestException("Debe seleccionar un veterinario");
        }

        Cliente cliente = this.buscarCliente(citaRq.getClienteId());
        Mascota mascota = this.buscarMascota(citaRq.getMascotaId());
        Medico medico = this.buscarMedicoActivo(medicoId);
        if (!mascota.getCliente().getClienteId().equals(cliente.getClienteId())) {
            throw new BadRequestException("La mascota seleccionada no pertenece al cliente");
        }

        LocalDateTime inicio = this.combinar(citaRq.getFecha(), citaRq.getHora());
        LocalDateTime fin = this.calcularFin(inicio, citaRq.getHoraFin(), medico.getDuracionCitaMin());
        this.validarQueNoSeaPasada(inicio);

        EstadoCita estado = this.convertirEstado(citaRq.getEstado());
        if (estado != EstadoCita.PENDIENTE && estado != EstadoCita.PROGRAMADA && estado != EstadoCita.CONFIRMADA) {
            throw new BadRequestException("Una cita nueva solo puede quedar Pendiente, Programada o Confirmada");
        }

        this.validarHorario(medico, inicio, fin);
        this.validarCruces(medico.getId(), mascota.getMascotaId(), inicio, fin, SIN_CITA);

        Cita cita = new Cita();
        cita.setMascota(mascota);
        cita.setMedico(medico);
        cita.setFechaHora(inicio);
        cita.setFechaHoraFin(fin);
        cita.setMotivo(citaRq.getMotivo().trim());
        cita.setEstado(estado);
        cita.setFechaCreacion(LocalDateTime.now());
        citaRepository.save(cita);
        this.registrar(cita, usuario, "CREADA", null, estado, null, inicio, null);

        return MiRespuestaRS.de(201, "Cita N.° " + cita.getCitaId() + " registrada para el "
                + inicio.toLocalDate() + " de " + inicio.toLocalTime() + " a " + fin.toLocalTime());
    }

    /**
     * {@inheritDoc}
     * <p>
     * Una cita atendida o cancelada no se edita. Si el estado destino es final
     * se aplica como cambio de estado; si no, se actualizan veterinario,
     * horario y motivo validando de nuevo las reglas de agenda.
     * </p>
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarCita(Long citaId, CitaRq citaRq) {
        Cita cita = this.buscarCita(citaId);
        Usuario usuario = usuarioActual.obtener();
        this.validarPropiedad(cita, usuario);
        this.validarEditable(cita);

        this.validarDatosObligatorios(citaRq, false);
        if (citaRq.getMascotaId() != null && !citaRq.getMascotaId().equals(cita.getMascota().getMascotaId())) {
            throw new BadRequestException("No se puede cambiar la mascota de una cita ya registrada");
        }
        if (citaRq.getClienteId() != null
                && !citaRq.getClienteId().equals(cita.getMascota().getCliente().getClienteId())) {
            throw new BadRequestException("No se puede cambiar el cliente de una cita ya registrada");
        }

        EstadoCita destino = this.convertirEstado(citaRq.getEstado());
        if (destino.esFinal()) {
            EstadoCitaRq rq = new EstadoCitaRq();
            rq.setEstado(destino.name());
            rq.setMotivo(destino == EstadoCita.CANCELADA ? "Cancelada desde la edición de la cita" : null);
            return this.cambiarEstado(citaId, rq);
        }
        if (!cita.getEstado().puedePasarA(destino)) {
            throw new ConflictException("No se puede pasar una cita de " + cita.getEstado() + " a " + destino);
        }

        Medico propio = this.medicoDeSesion(usuario);
        Long medicoId = propio != null ? propio.getId() : citaRq.getMedicoId();
        if (medicoId == null) {
            throw new BadRequestException("Debe seleccionar un veterinario");
        }
        boolean cambioMedico = !medicoId.equals(cita.getMedico().getId());
        Medico medico = cambioMedico ? this.buscarMedicoActivo(medicoId) : cita.getMedico();

        LocalDateTime inicio = this.combinar(citaRq.getFecha(), citaRq.getHora());
        LocalTime horaFin = citaRq.getHoraFin() != null ? citaRq.getHoraFin()
                : inicio.toLocalTime().plusMinutes(this.duracion(cita));
        LocalDateTime fin = this.calcularFin(inicio, horaFin, medico.getDuracionCitaMin());
        boolean cambioHorario = !inicio.equals(cita.getFechaHora()) || !fin.equals(cita.getFechaHoraFin());
        if (cambioHorario && !inicio.equals(cita.getFechaHora())) {
            this.validarQueNoSeaPasada(inicio);
        }
        if (cambioHorario || cambioMedico) {
            this.validarHorario(medico, inicio, fin);
            this.validarCruces(medico.getId(), cita.getMascota().getMascotaId(), inicio, fin, cita.getCitaId());
        }

        LocalDateTime inicioAnterior = cita.getFechaHora();
        EstadoCita estadoAnterior = cita.getEstado();
        cita.setMedico(medico);
        cita.setFechaHora(inicio);
        cita.setFechaHoraFin(fin);
        cita.setMotivo(citaRq.getMotivo().trim());
        cita.setEstado(destino);
        cita.setFechaModificacion(LocalDateTime.now());
        citaRepository.save(cita);

        String detalle = cambioMedico ? "Veterinario: " + this.nombre(medico) : null;
        if (cambioHorario) {
            this.registrar(cita, usuario, "REPROGRAMADA", estadoAnterior, destino, inicioAnterior, inicio, detalle);
        } else {
            this.registrar(cita, usuario, estadoAnterior != destino ? "ESTADO" : "EDITADA", estadoAnterior, destino,
                    null, null, detalle);
        }
        return MiRespuestaRS.de(200, "Cita actualizada correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS reactivarCita(Long citaId) {
        Cita cita = this.buscarCita(citaId);
        Usuario usuario = usuarioActual.obtener();
        this.validarPropiedad(cita, usuario);
        if (cita.getEstado() != EstadoCita.CANCELADA) {
            throw new ConflictException("Solo se pueden reactivar citas canceladas");
        }
        if (cita.getFechaHora().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("La fecha de la cita ya pasó; registre una cita nueva");
        }
        this.validarActivo(cita.getMedico());
        this.validarHorario(cita.getMedico(), cita.getFechaHora(), cita.getFechaHoraFin());
        this.validarCruces(cita.getMedico().getId(), cita.getMascota().getMascotaId(),
                cita.getFechaHora(), cita.getFechaHoraFin(), cita.getCitaId());

        cita.setEstado(EstadoCita.PENDIENTE);
        cita.setMotivoCancelacion(null);
        cita.setFechaModificacion(LocalDateTime.now());
        citaRepository.save(cita);
        this.registrar(cita, usuario, "REACTIVADA", EstadoCita.CANCELADA, EstadoCita.PENDIENTE, null, null, null);
        return MiRespuestaRS.de(200, "Cita reactivada correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS cambiarEstado(Long citaId, EstadoCitaRq rq) {
        if (rq == null || rq.getEstado() == null || rq.getEstado().isBlank()) {
            throw new BadRequestException("Debe indicar el estado nuevo");
        }
        Cita cita = this.buscarCita(citaId);
        Usuario usuario = usuarioActual.obtener();
        this.validarPropiedad(cita, usuario);
        EstadoCita destino = this.convertirEstado(rq.getEstado());
        EstadoCita actual = cita.getEstado();
        if (actual == destino) {
            return MiRespuestaRS.de(200, "La cita ya está " + destino.name().toLowerCase());
        }
        if (!actual.puedePasarA(destino)) {
            throw new ConflictException("No se puede pasar una cita de " + actual + " a " + destino);
        }
        String motivo;
        if (destino == EstadoCita.CANCELADA) {
            motivo = Validaciones.obligatorio(rq.getMotivo(), "El motivo de la cancelación", 255);
            cita.setMotivoCancelacion(motivo);
        } else {
            motivo = Validaciones.opcional(rq.getMotivo(), "La observación", 255);
        }
        if (destino == EstadoCita.ATENDIDA && cita.getFechaHora().isAfter(LocalDateTime.now())) {
            throw new ConflictException("No se puede marcar como atendida una cita que aún no ha empezado ("
                    + cita.getFechaHora().toLocalDate() + " " + cita.getFechaHora().toLocalTime() + ")");
        }
        cita.setEstado(destino);
        cita.setFechaModificacion(LocalDateTime.now());
        citaRepository.save(cita);
        this.registrar(cita, usuario, "ESTADO", actual, destino, null, null, motivo);
        String texto = switch (destino) {
            case ATENDIDA -> "Cita marcada como atendida";
            case CANCELADA -> "Cita cancelada; se conserva en el historial";
            case CONFIRMADA -> "Cita confirmada";
            default -> "Estado de la cita actualizado";
        };
        return MiRespuestaRS.de(200, texto);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS reprogramarCita(Long citaId, ReprogramarCitaRq rq) {
        if (rq == null || rq.getFecha() == null || rq.getHora() == null) {
            throw new BadRequestException("Debe indicar la nueva fecha y hora");
        }
        Cita cita = this.buscarCita(citaId);
        Usuario usuario = usuarioActual.obtener();
        this.validarPropiedad(cita, usuario);
        this.validarEditable(cita);
        this.validarActivo(cita.getMedico());

        LocalDateTime inicio = this.combinar(rq.getFecha(), rq.getHora());
        LocalTime horaFin = rq.getHoraFin() != null ? rq.getHoraFin()
                : inicio.toLocalTime().plusMinutes(this.duracion(cita));
        LocalDateTime fin = this.calcularFin(inicio, horaFin, cita.getMedico().getDuracionCitaMin());
        if (inicio.equals(cita.getFechaHora()) && fin.equals(cita.getFechaHoraFin())) {
            return MiRespuestaRS.de(200, "La cita conserva su horario");
        }
        this.validarQueNoSeaPasada(inicio);
        this.validarHorario(cita.getMedico(), inicio, fin);
        this.validarCruces(cita.getMedico().getId(), cita.getMascota().getMascotaId(), inicio, fin, cita.getCitaId());

        LocalDateTime anterior = cita.getFechaHora();
        cita.setFechaHora(inicio);
        cita.setFechaHoraFin(fin);
        cita.setFechaModificacion(LocalDateTime.now());
        citaRepository.save(cita);
        this.registrar(cita, usuario, "REPROGRAMADA", cita.getEstado(), cita.getEstado(), anterior, inicio,
                Validaciones.opcional(rq.getObservacion(), "La observación", 255));
        return MiRespuestaRS.de(200, "Cita reprogramada para el " + inicio.toLocalDate() + " de "
                + inicio.toLocalTime() + " a " + fin.toLocalTime());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<CitaRs> calendario(LocalDate desde, LocalDate hasta, Long medicoId) {
        this.validarPeriodo(desde, hasta, DIAS_MAXIMOS_CALENDARIO);
        Medico propio = this.medicoDeSesion(usuarioActual.obtener());
        Long filtro = propio != null ? propio.getId() : medicoId;
        return citaRepository.buscarEnRango(filtro, desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay())
                .stream().map(this::convertirARespuesta).toList();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<CitaHistorialRs> historialCita(Long citaId) {
        this.buscarCita(citaId);
        return historialRepository.findByCita_CitaIdOrderByFechaAscHistorialIdAsc(citaId).stream().map(h -> {
            CitaHistorialRs rs = new CitaHistorialRs();
            rs.setFecha(h.getFecha());
            rs.setUsuario(h.getUsuario() == null ? "Sistema" : h.getUsuario().getUsername());
            rs.setAccion(h.getAccion());
            rs.setEstadoAnterior(h.getEstadoAnterior());
            rs.setEstadoNuevo(h.getEstadoNuevo());
            rs.setInicioAnterior(h.getInicioAnterior());
            rs.setInicioNuevo(h.getInicioNuevo());
            rs.setObservacion(h.getObservacion());
            return rs;
        }).toList();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<EstadoCitaCatalogo> listarEstados() {
        return estadoCitaRepository.findAllByOrderByOrdenAsc();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public byte[] reporteExcel(LocalDate desde, LocalDate hasta, Long medicoId, String estado) {
        this.validarPeriodo(desde, hasta, DIAS_MAXIMOS_REPORTE);
        Medico propio = this.medicoDeSesion(usuarioActual.obtener());
        Long filtro = propio != null ? propio.getId() : medicoId;
        String nombreMedico = filtro == null ? "Todos" : this.nombre(medicoRepository.findById(filtro)
                .orElseThrow(() -> new NotFoundException("El veterinario no existe")));
        EstadoCita estadoFiltro = estado == null || estado.isBlank() ? null : this.convertirEstado(estado);
        List<CitaRs> citas = citaRepository.buscarEnRango(filtro, desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay())
                .stream()
                .filter(c -> estadoFiltro == null || c.getEstado() == estadoFiltro)
                .map(this::convertirARespuesta).toList();
        Map<String, String> nombres = estadoCitaRepository.findAllByOrderByOrdenAsc().stream()
                .collect(Collectors.toMap(EstadoCitaCatalogo::getCodigo, EstadoCitaCatalogo::getNombre,
                        (a, b) -> a, LinkedHashMap::new));
        return excel.citas(citas, desde, hasta, nombreMedico, nombres);
    }

    // ===================== Validaciones =====================

    /**
     * Valida los datos que deben venir siempre en la solicitud.
     */
    private void validarDatosObligatorios(CitaRq citaRq, boolean creacion) {
        if (citaRq == null) {
            throw new BadRequestException("Debe enviar los datos de la cita");
        }
        if (creacion && citaRq.getClienteId() == null) {
            throw new BadRequestException("Debe seleccionar un cliente");
        }
        if (creacion && citaRq.getMascotaId() == null) {
            throw new BadRequestException("Debe seleccionar una mascota");
        }
        if (citaRq.getFecha() == null) {
            throw new BadRequestException("Debe indicar la fecha de la cita");
        }
        if (citaRq.getHora() == null) {
            throw new BadRequestException("Debe indicar la hora de inicio de la cita");
        }
        if (citaRq.getMotivo() == null || citaRq.getMotivo().isBlank()) {
            throw new BadRequestException("El motivo de la consulta es obligatorio");
        }
        if (citaRq.getMotivo().trim().length() > LONGITUD_MAXIMA_MOTIVO) {
            throw new BadRequestException("El motivo no puede superar los " + LONGITUD_MAXIMA_MOTIVO + " caracteres");
        }
        if (citaRq.getEstado() == null || citaRq.getEstado().isBlank()) {
            throw new BadRequestException("Debe indicar el estado de la cita");
        }
    }

    /**
     * Una cita atendida o cancelada ya no se modifica.
     */
    private void validarEditable(Cita cita) {
        if (cita.getEstado() == EstadoCita.ATENDIDA) {
            throw new ConflictException("La cita ya fue atendida y hace parte del historial clínico; no se puede modificar");
        }
        if (cita.getEstado() == EstadoCita.CANCELADA) {
            throw new ConflictException("La cita está cancelada y no se puede modificar. Para activarla de nuevo use la opción de reactivar");
        }
    }

    /**
     * Calcula el fin de la cita y valida su duración.
     *
     * @param inicio          inicio.
     * @param horaFin         hora de fin pedida (null = duración por defecto).
     * @param duracionDefecto duración por defecto del veterinario.
     * @return fin de la cita.
     */
    private LocalDateTime calcularFin(LocalDateTime inicio, LocalTime horaFin, Integer duracionDefecto) {
        LocalDateTime fin = horaFin == null
                ? inicio.plusMinutes(duracionDefecto == null ? 30 : duracionDefecto)
                : LocalDateTime.of(inicio.toLocalDate(), horaFin.truncatedTo(ChronoUnit.MINUTES));
        if (!fin.toLocalDate().equals(inicio.toLocalDate()) && !fin.toLocalTime().equals(LocalTime.MIDNIGHT)) {
            throw new BadRequestException("La cita debe empezar y terminar el mismo día");
        }
        if (!fin.isAfter(inicio)) {
            throw new BadRequestException("La hora de fin debe ser posterior a la hora de inicio");
        }
        long minutos = Duration.between(inicio, fin).toMinutes();
        if (minutos < DURACION_MINIMA || minutos > DURACION_MAXIMA) {
            throw new BadRequestException("La cita debe durar entre " + DURACION_MINIMA + " y " + DURACION_MAXIMA
                    + " minutos (se pidieron " + minutos + ")");
        }
        return fin;
    }

    /**
     * La cita debe quedar completa dentro de una franja del horario del veterinario.
     */
    private void validarHorario(Medico medico, LocalDateTime inicio, LocalDateTime fin) {
        DayOfWeek dia = inicio.getDayOfWeek();
        List<HorarioMedico> franjas = horarioRepository.findByMedico_IdAndDiaSemanaAndActivoTrue(medico.getId(),
                dia.getValue());
        String nombreDia = dia.getDisplayName(TextStyle.FULL, Locale.forLanguageTag("es"));
        if (franjas.isEmpty()) {
            throw new ConflictException(this.nombre(medico) + " no atiende los " + (nombreDia.endsWith("s") ? nombreDia : nombreDia + "s"));
        }
        LocalTime hi = inicio.toLocalTime();
        LocalTime hf = fin.toLocalDate().isAfter(inicio.toLocalDate()) ? LocalTime.MAX : fin.toLocalTime();
        boolean cabe = franjas.stream().anyMatch(f -> !hi.isBefore(f.getHoraInicio()) && !hf.isAfter(f.getHoraFin()));
        if (!cabe) {
            String horario = franjas.stream()
                    .sorted((a, b) -> a.getHoraInicio().compareTo(b.getHoraInicio()))
                    .map(f -> f.getHoraInicio() + "–" + f.getHoraFin())
                    .collect(Collectors.joining(", "));
            throw new ConflictException("El horario " + hi + "–" + fin.toLocalTime() + " está fuera de la disponibilidad de "
                    + this.nombre(medico) + " el " + nombreDia + " (" + horario + ")");
        }
    }

    /**
     * El veterinario y la mascota no pueden tener otra cita activa que se cruce.
     */
    private void validarCruces(Long medicoId, Integer mascotaId, LocalDateTime inicio, LocalDateTime fin,
                               Long citaIdExcluido) {
        if (citaRepository.contarCrucesDelMedico(medicoId, EstadoCita.CANCELADA, inicio, fin, citaIdExcluido) > 0) {
            throw new ConflictException("El veterinario ya tiene una cita que se cruza con ese horario");
        }
        if (citaRepository.contarCrucesDeLaMascota(mascotaId, EstadoCita.CANCELADA, inicio, fin, citaIdExcluido) > 0) {
            throw new ConflictException("La mascota ya tiene una cita que se cruza con ese horario");
        }
    }

    /**
     * No se registran ni se mueven citas al pasado.
     */
    private void validarQueNoSeaPasada(LocalDateTime fechaHora) {
        if (fechaHora.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("No se pueden programar citas en fechas u horas que ya pasaron");
        }
    }

    /**
     * Valida un período de consulta.
     */
    private void validarPeriodo(LocalDate desde, LocalDate hasta, int diasMaximos) {
        if (desde == null || hasta == null) {
            throw new BadRequestException("Debe indicar la fecha inicial y la fecha final");
        }
        if (desde.isAfter(hasta)) {
            throw new BadRequestException("La fecha inicial no puede ser posterior a la fecha final");
        }
        if (ChronoUnit.DAYS.between(desde, hasta) >= diasMaximos) {
            throw new BadRequestException("El período no puede superar " + diasMaximos + " días");
        }
    }

    /**
     * El veterinario solo puede operar sus propias citas.
     */
    private void validarPropiedad(Cita cita, Usuario usuario) {
        Medico propio = this.medicoDeSesion(usuario);
        if (propio != null && !propio.getId().equals(cita.getMedico().getId())) {
            throw new SinPermisoException("La cita N.° " + cita.getCitaId() + " pertenece a otro veterinario");
        }
    }

    /**
     * Un veterinario inactivo no recibe citas.
     */
    private void validarActivo(Medico medico) {
        if (!Boolean.TRUE.equals(medico.getActivo())) {
            throw new ConflictException(this.nombre(medico) + " está inactivo y no puede recibir citas");
        }
    }

    // ===================== Búsquedas y utilidades =====================

    /**
     * Médico enlazado al usuario si es veterinario; null para los demás perfiles.
     */
    private Medico medicoDeSesion(Usuario usuario) {
        if (!ROL_VETERINARIO.equals(usuario.getRol())) {
            return null;
        }
        return medicoRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new ConflictException(
                        "Su usuario no está enlazado a un médico veterinario; solicite al administrador que lo asocie"));
    }

    /**
     * Registra un cambio en el historial de la cita.
     */
    private void registrar(Cita cita, Usuario usuario, String accion, EstadoCita anterior, EstadoCita nuevo,
                           LocalDateTime inicioAnterior, LocalDateTime inicioNuevo, String observacion) {
        CitaHistorial h = new CitaHistorial();
        h.setCita(cita);
        h.setFecha(LocalDateTime.now());
        h.setUsuario(usuario);
        h.setAccion(accion);
        h.setEstadoAnterior(anterior == null ? null : anterior.name());
        h.setEstadoNuevo(nuevo == null ? null : nuevo.name());
        h.setInicioAnterior(inicioAnterior);
        h.setInicioNuevo(inicioNuevo);
        h.setObservacion(observacion);
        historialRepository.save(h);
    }

    /**
     * Une fecha y hora sin segundos.
     */
    private LocalDateTime combinar(LocalDate fecha, LocalTime hora) {
        return LocalDateTime.of(fecha, hora).truncatedTo(ChronoUnit.MINUTES);
    }

    /**
     * Duración actual de una cita en minutos.
     */
    private long duracion(Cita cita) {
        return Duration.between(cita.getFechaHora(), cita.getFechaHoraFin()).toMinutes();
    }

    /**
     * Convierte el texto en un estado de cita.
     */
    private EstadoCita convertirEstado(String texto) {
        try {
            return EstadoCita.valueOf(texto.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("El estado '" + texto + "' no es válido. "
                    + "Use Pendiente, Programada, Confirmada, Atendida o Cancelada");
        }
    }

    private Cita buscarCita(Long citaId) {
        return citaRepository.findById(citaId).orElseThrow(() -> new NotFoundException("La cita no existe"));
    }

    private Cliente buscarCliente(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new NotFoundException("El cliente seleccionado no existe"));
        if (!Boolean.TRUE.equals(cliente.getActivo())) {
            throw new ConflictException("El cliente está inactivo y no puede agendar citas");
        }
        return cliente;
    }

    private Mascota buscarMascota(Integer mascotaId) {
        return mascotaRepository.findById(mascotaId)
                .orElseThrow(() -> new NotFoundException("La mascota seleccionada no existe"));
    }

    private Medico buscarMedicoActivo(Long medicoId) {
        Medico medico = medicoRepository.findById(medicoId)
                .orElseThrow(() -> new NotFoundException("El veterinario seleccionado no existe"));
        this.validarActivo(medico);
        return medico;
    }

    private String nombre(Medico medico) {
        return medico.getNombres() + " " + medico.getApellidos();
    }

    /**
     * Convierte una cita en la respuesta del API.
     */
    private CitaRs convertirARespuesta(Cita cita) {
        Mascota mascota = cita.getMascota();
        Cliente cliente = mascota.getCliente();
        Medico medico = cita.getMedico();

        CitaRs rs = new CitaRs();
        rs.setCitaId(cita.getCitaId());
        rs.setFecha(cita.getFechaHora().toLocalDate());
        rs.setHora(cita.getFechaHora().toLocalTime());
        rs.setHoraFin(cita.getFechaHoraFin().toLocalTime());
        rs.setInicio(cita.getFechaHora());
        rs.setFin(cita.getFechaHoraFin());
        rs.setClienteId(cliente.getClienteId());
        rs.setClienteNombre(cliente.getNombres() + " " + cliente.getApellidos());
        rs.setClienteTelefono(cliente.getTelefono());
        rs.setMascotaId(mascota.getMascotaId());
        rs.setMascotaNombre(mascota.getNombreMascota());
        rs.setMascotaEdad(mascota.getEdad());
        rs.setMascotaRaza(mascota.getRaza() == null ? null
                : mascota.getRaza().getNombre() + " (" + mascota.getRaza().getEspecie() + ")");
        rs.setMedicoId(medico.getId());
        rs.setMedicoNombre(this.nombre(medico));
        rs.setEspecialidad(medico.getEspecializacion() == null ? null : medico.getEspecializacion().getNombre());
        rs.setMotivo(cita.getMotivo());
        rs.setEstado(cita.getEstado().name());
        rs.setMotivoCancelacion(cita.getMotivoCancelacion());
        rs.setFechaCreacion(cita.getFechaCreacion());
        rs.setFechaModificacion(cita.getFechaModificacion());
        return rs;
    }
}
