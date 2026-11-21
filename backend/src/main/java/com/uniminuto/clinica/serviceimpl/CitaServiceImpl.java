package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.CitaHistorial;
import com.uniminuto.clinica.entity.EstadoCita;
import com.uniminuto.clinica.entity.HorarioMedico;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.entity.Tarifa;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.ForbiddenException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.CambioEstadoRq;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.ReporteData;
import com.uniminuto.clinica.repository.CitaHistorialRepository;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.EstadoCitaRepository;
import com.uniminuto.clinica.repository.HorarioMedicoRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.repository.TarifaRepository;
import com.uniminuto.clinica.security.ContextoUsuario;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.security.UsuarioActual;
import com.uniminuto.clinica.service.AuthService;
import com.uniminuto.clinica.service.CitaService;
import com.uniminuto.clinica.utils.Constantes;
import com.uniminuto.clinica.utils.Formato;
import com.uniminuto.clinica.utils.Validar;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Reglas de agenda:
 * - Un veterinario no tiene dos citas superpuestas; una mascota tampoco.
 * - No se asignan citas a veterinarios inactivos ni fuera de su horario de disponibilidad.
 * - Las citas canceladas no se borran: conservan su historial y dejan libre el horario.
 * - Cada cita queda ligada a mascota, propietario y veterinario.
 */
@Service
public class CitaServiceImpl implements CitaService {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");
    private static final Set<String> NO_EDITABLES = Set.of(Constantes.CITA_ATENDIDA, Constantes.CITA_CANCELADA,
            Constantes.CITA_EN_ATENCION);

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private CitaHistorialRepository historialRepository;

    @Autowired
    private EstadoCitaRepository estadoCitaRepository;

    @Autowired
    private MascotaRepository mascotaRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private HorarioMedicoRepository horarioRepository;

    @Autowired
    private TarifaRepository tarifaRepository;

    @Autowired
    private AuthService authService;

    @PersistenceContext
    private EntityManager entityManager;

    // ------------------------------------------------------------------ consultas

    @Override
    @Transactional(readOnly = true)
    public List<Cita> listarCitas(LocalDate fechaInicial, LocalDate fechaFinal, Long medicoId, String estado) {
        List<Cita> base;
        if (fechaInicial != null || fechaFinal != null) {
            LocalDate ini = fechaInicial == null ? LocalDate.of(2000, 1, 1) : fechaInicial;
            LocalDate fin = fechaFinal == null ? LocalDate.of(2100, 1, 1) : fechaFinal;
            validarRango(ini, fin);
            base = citaRepository.findByFechaHoraBetweenOrderByFechaHoraAsc(ini.atStartOfDay(), fin.plusDays(1).atStartOfDay());
        } else {
            base = citaRepository.findAllByOrderByFechaHoraDesc();
        }
        String est = Validar.vacio(estado) ? null : estado.trim().toUpperCase();
        return base.stream()
                .filter(c -> medicoId == null || c.getMedico().getId().equals(medicoId))
                .filter(c -> est == null || est.equals(c.getEstado()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Cita> listarCitasRango(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        if (fechaInicio == null || fechaFin == null || fechaInicio.isAfter(fechaFin)) {
            throw new BadRequestException("Rango de fechas inválido.");
        }
        return citaRepository.findByFechaHoraBetweenOrderByFechaHoraAsc(fechaInicio, fechaFin);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Cita> agendaMedico(LocalDateTime inicio, LocalDateTime fin) {
        Long medicoId = medicoAutenticado();
        if (inicio == null || fin == null || !inicio.isBefore(fin)) {
            throw new BadRequestException("Rango de fechas inválido para el calendario.");
        }
        if (Duration.between(inicio, fin).toDays() > 62) {
            throw new BadRequestException("El calendario consulta máximo 62 días por petición.");
        }
        return citaRepository.findByMedicoEnRango(medicoId, inicio, fin);
    }

    @Override
    @Transactional(readOnly = true)
    public Cita consultar(Long citaId) {
        Validar.idValido(citaId, "citaId");
        Cita c = citaRepository.findById(citaId).orElseThrow(() -> new NotFoundException("La cita no existe."));
        verificarAccesoMedico(c);
        return c;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Cita> listarCitasPorMascota(Integer mascotaId) {
        Validar.idValido(mascotaId, "mascotaId");
        Mascota m = mascotaRepository.findById(mascotaId).orElseThrow(() -> new NotFoundException("La mascota no existe."));
        return citaRepository.findByMascotaOrderByFechaHoraDesc(m);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CitaHistorial> historial(Long citaId) {
        consultar(citaId);
        return historialRepository.findByCita_IdOrderByFechaAscIdAsc(citaId);
    }

    @Override
    public List<EstadoCita> estados() {
        return estadoCitaRepository.findAllByOrderByOrdenAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> resumenEstados(LocalDate fechaInicial, LocalDate fechaFinal) {
        LocalDate ini = fechaInicial == null ? LocalDate.now().withDayOfMonth(1) : fechaInicial;
        LocalDate fin = fechaFinal == null ? ini.plusMonths(1).minusDays(1) : fechaFinal;
        validarRango(ini, fin);
        UsuarioActual u = ContextoUsuario.obtener();
        List<Cita> citas = Roles.MEDICO.equals(u.perfilCodigo())
                ? citaRepository.findByMedicoEnRango(u.medicoId(), ini.atStartOfDay(), fin.plusDays(1).atStartOfDay())
                : citaRepository.findByFechaHoraBetweenOrderByFechaHoraAsc(ini.atStartOfDay(), fin.plusDays(1).atStartOfDay());
        Map<String, Long> resumen = new LinkedHashMap<>();
        for (EstadoCita e : estados()) {
            resumen.put(e.getCodigo(), 0L);
        }
        for (Cita c : citas) {
            resumen.merge(c.getEstado(), 1L, Long::sum);
        }
        resumen.put("TOTAL", (long) citas.size());
        return resumen;
    }

    // ------------------------------------------------------------------ operaciones

    @Override
    @Transactional
    public MiRespuestaRS crearCita(CitaRq rq) {
        validarBasico(rq);
        UsuarioActual u = ContextoUsuario.obtener();
        Long medicoId = rq.getMedicoId();
        if (Roles.MEDICO.equals(u.perfilCodigo())) {
            if (medicoId != null && !medicoId.equals(u.medicoId())) {
                throw new ForbiddenException("Un veterinario sólo puede agendar citas en su propia agenda.");
            }
            medicoId = u.medicoId();
        }
        Validar.idValido(medicoId, "medicoId");
        String estadoInicial = Validar.vacio(rq.getEstado()) ? Constantes.CITA_PROGRAMADA
                : Validar.enLista(rq.getEstado(), Constantes.CITA_ESTADOS_INICIALES, "estado inicial");

        Medico medico = bloquearMedico(medicoId);
        Mascota mascota = mascotaActiva(rq.getMascotaId());
        Tarifa tarifa = tarifa(rq.getTarifaId());
        LocalDateTime fin = calcularFin(rq.getFechaHora(), rq.getFechaHoraFin(), tarifa);
        validarProgramacion(medico, mascota, rq.getFechaHora(), fin, -1L);

        Cita c = new Cita();
        c.setCliente(mascota.getCliente());
        c.setMascota(mascota);
        c.setMedico(medico);
        c.setTarifa(tarifa);
        c.setFechaHora(rq.getFechaHora());
        c.setFechaHoraFin(fin);
        c.setMotivo(rq.getMotivo().trim());
        c.setEstado(estadoInicial);
        c.setUsuarioCreacionId(u.usuarioId());
        c.setFechaCreacion(LocalDateTime.now());
        citaRepository.save(c);
        registrar(c, "CREACION", null, estadoInicial, null, c.getFechaHora(), "Cita registrada");
        return MiRespuestaRS.creado("Cita agendada para " + mascota.getNombreMascota() + " con " + medico.nombreCompleto()
                + " el " + Formato.fechaHora(c.getFechaHora()) + ".", c.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS actualizarCita(CitaRq rq) {
        validarBasico(rq);
        Validar.idValido(rq.getId(), "id");
        Cita c = citaRepository.findById(rq.getId()).orElseThrow(() -> new NotFoundException("La cita no existe."));
        verificarAccesoMedico(c);
        if (NO_EDITABLES.contains(c.getEstado())) {
            throw new ConflictException("Una cita " + c.getEstado().toLowerCase().replace('_', ' ')
                    + " no se puede modificar (es información histórica).");
        }
        if (!c.getMascota().getMascotaId().equals(rq.getMascotaId())) {
            throw new ConflictException("La mascota de una cita no se cambia; registre una cita nueva.");
        }
        UsuarioActual u = ContextoUsuario.obtener();
        Long medicoId = Roles.MEDICO.equals(u.perfilCodigo()) ? u.medicoId() : rq.getMedicoId();
        Validar.idValido(medicoId, "medicoId");
        Medico medico = bloquearMedico(medicoId);
        Tarifa tarifa = tarifa(rq.getTarifaId());
        LocalDateTime fin = calcularFin(rq.getFechaHora(), rq.getFechaHoraFin(), tarifa);
        boolean cambiaHorario = !c.getFechaHora().equals(rq.getFechaHora()) || !c.getFechaHoraFin().equals(fin)
                || !c.getMedico().getId().equals(medico.getId());
        if (cambiaHorario) {
            validarProgramacion(medico, c.getMascota(), rq.getFechaHora(), fin, c.getId());
        }
        LocalDateTime anterior = c.getFechaHora();
        c.setMedico(medico);
        c.setTarifa(tarifa);
        c.setFechaHora(rq.getFechaHora());
        c.setFechaHoraFin(fin);
        c.setMotivo(rq.getMotivo().trim());
        c.setFechaModificacion(LocalDateTime.now());
        citaRepository.save(c);
        registrar(c, cambiaHorario ? "REPROGRAMACION" : "EDICION", c.getEstado(), c.getEstado(), anterior,
                c.getFechaHora(), "Cita editada");
        return MiRespuestaRS.ok("Cita actualizada correctamente.", c.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS reprogramar(CambioEstadoRq rq) {
        if (rq == null) {
            throw new BadRequestException("Los datos de reprogramación son obligatorios.");
        }
        Validar.idValido(rq.getCitaId(), "citaId");
        Validar.obligatorio(rq.getFechaHora(), "fecha y hora");
        Cita c = citaRepository.findById(rq.getCitaId()).orElseThrow(() -> new NotFoundException("La cita no existe."));
        verificarAccesoMedico(c);
        if (NO_EDITABLES.contains(c.getEstado())) {
            throw new ConflictException("No se puede reprogramar una cita " + c.getEstado().toLowerCase().replace('_', ' ') + ".");
        }
        long duracion = Duration.between(c.getFechaHora(), c.getFechaHoraFin()).toMinutes();
        LocalDateTime fin = rq.getFechaHoraFin() != null ? rq.getFechaHoraFin() : rq.getFechaHora().plusMinutes(duracion);
        Medico medico = bloquearMedico(c.getMedico().getId());
        validarProgramacion(medico, c.getMascota(), rq.getFechaHora(), fin, c.getId());
        LocalDateTime anterior = c.getFechaHora();
        c.setFechaHora(rq.getFechaHora());
        c.setFechaHoraFin(fin);
        c.setFechaModificacion(LocalDateTime.now());
        citaRepository.save(c);
        registrar(c, "REPROGRAMACION", c.getEstado(), c.getEstado(), anterior, c.getFechaHora(),
                Validar.vacio(rq.getObservacion()) ? "Reprogramada desde el calendario" : rq.getObservacion().trim());
        return MiRespuestaRS.ok("Cita reprogramada para el " + Formato.fechaHora(c.getFechaHora()) + ".", c.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS cambiarEstado(CambioEstadoRq rq) {
        if (rq == null) {
            throw new BadRequestException("Los datos del cambio de estado son obligatorios.");
        }
        Validar.idValido(rq.getCitaId(), "citaId");
        String nuevo = Validar.enLista(rq.getEstado(), Set.of(Constantes.CITA_PENDIENTE, Constantes.CITA_PROGRAMADA,
                Constantes.CITA_CONFIRMADA, Constantes.CITA_CANCELADA), "estado");
        Cita c = citaRepository.findById(rq.getCitaId()).orElseThrow(() -> new NotFoundException("La cita no existe."));
        verificarAccesoMedico(c);
        String actual = c.getEstado();
        if (NO_EDITABLES.contains(actual)) {
            throw new ConflictException("La cita está " + actual.toLowerCase().replace('_', ' ')
                    + "; no admite cambios de estado" + (Constantes.CITA_CANCELADA.equals(actual)
                    ? " (use 'reactivar')." : "."));
        }
        if (actual.equals(nuevo)) {
            throw new ConflictException("La cita ya se encuentra en estado " + nuevo + ".");
        }
        if (Constantes.CITA_CANCELADA.equals(nuevo)) {
            String motivo = Validar.texto(rq.getObservacion(), "motivo de cancelación", 500);
            c.setMotivoCancelacion(motivo);
        }
        c.setEstado(nuevo);
        c.setFechaModificacion(LocalDateTime.now());
        citaRepository.save(c);
        registrar(c, "CAMBIO_ESTADO", actual, nuevo, null, null, Validar.limpiar(rq.getObservacion()));
        return MiRespuestaRS.ok("Estado de la cita: " + nuevo + ".", c.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS reactivar(Long citaId) {
        Validar.idValido(citaId, "citaId");
        Cita c = citaRepository.findById(citaId).orElseThrow(() -> new NotFoundException("La cita no existe."));
        verificarAccesoMedico(c);
        if (!Constantes.CITA_CANCELADA.equals(c.getEstado())) {
            throw new ConflictException("Sólo se pueden reactivar citas canceladas.");
        }
        Medico medico = bloquearMedico(c.getMedico().getId());
        validarProgramacion(medico, c.getMascota(), c.getFechaHora(), c.getFechaHoraFin(), c.getId());
        c.setEstado(Constantes.CITA_PENDIENTE);
        c.setFechaModificacion(LocalDateTime.now());
        citaRepository.save(c);
        registrar(c, "CAMBIO_ESTADO", Constantes.CITA_CANCELADA, Constantes.CITA_PENDIENTE, null, null, "Cita reactivada");
        return MiRespuestaRS.ok("Cita reactivada en estado PENDIENTE.", c.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public ReporteData reporteCitasMedico(LocalDate fechaInicial, LocalDate fechaFinal, Long medicoId) {
        Validar.obligatorio(fechaInicial, "fecha inicial");
        Validar.obligatorio(fechaFinal, "fecha final");
        validarRango(fechaInicial, fechaFinal);
        UsuarioActual u = ContextoUsuario.obtener();
        Long id = Roles.MEDICO.equals(u.perfilCodigo()) ? u.medicoId() : medicoId;
        Validar.idValido(id, "medicoId");
        Medico medico = medicoRepository.findById(id).orElseThrow(() -> new NotFoundException("El veterinario no existe."));
        List<Cita> citas = citaRepository.findByMedicoEnRango(id, fechaInicial.atStartOfDay(),
                fechaFinal.plusDays(1).atStartOfDay());

        ReporteData r = new ReporteData();
        r.setCodigo("citas-medico");
        r.setTitulo("Citas del veterinario " + medico.nombreCompleto());
        r.setSubtitulo("Especialidad: " + medico.getEspecializacion().getNombre() + "  |  Periodo: "
                + Formato.fecha(fechaInicial) + " a " + Formato.fecha(fechaFinal));
        r.setGeneradoPor(u.nombreCompleto());
        r.columna("N° cita", "ENTERO").columna("Fecha", "FECHA").columna("Inicio", "TEXTO").columna("Fin", "TEXTO")
                .columna("Estado", "TEXTO").columna("Propietario", "TEXTO").columna("Documento", "TEXTO")
                .columna("Teléfono", "TEXTO").columna("Mascota", "TEXTO").columna("Especie / raza", "TEXTO")
                .columna("Servicio", "TEXTO").columna("Motivo", "TEXTO");
        Map<String, Long> conteo = new LinkedHashMap<>();
        for (Cita c : citas) {
            List<Object> fila = new ArrayList<>();
            fila.add(c.getId());
            fila.add(c.getFechaHora().toLocalDate());
            fila.add(HORA.format(c.getFechaHora()));
            fila.add(HORA.format(c.getFechaHoraFin()));
            fila.add(c.getEstado());
            fila.add(c.getCliente().getNombres() + " " + c.getCliente().getApellidos());
            fila.add(c.getCliente().getTipoDocumento() + " " + c.getCliente().getNumeroDocumento());
            fila.add(c.getCliente().getTelefono());
            fila.add(c.getMascota().getNombreMascota());
            fila.add(c.getMascota().getRaza().getEspecie() + " / " + c.getMascota().getRaza().getNombre());
            fila.add(c.getTarifa() == null ? "" : c.getTarifa().getNombre());
            fila.add(c.getMotivo());
            r.getFilas().add(fila);
            conteo.merge(c.getEstado(), 1L, Long::sum);
        }
        List<Object> totales = new ArrayList<>();
        totales.add("Total: " + citas.size());
        StringBuilder resumen = new StringBuilder();
        conteo.forEach((k, v) -> resumen.append(k).append(": ").append(v).append("  "));
        totales.add(null);
        totales.add(null);
        totales.add(null);
        totales.add(resumen.toString().trim());
        r.setTotales(totales);
        return r;
    }

    // ------------------------------------------------------------------ reglas

    private void validarProgramacion(Medico medico, Mascota mascota, LocalDateTime inicio, LocalDateTime fin, Long excluirId) {
        if (!Boolean.TRUE.equals(medico.getEstado())) {
            throw new ConflictException("No se pueden asignar citas al veterinario " + medico.nombreCompleto() + ": está inactivo.");
        }
        if (!inicio.isBefore(fin)) {
            throw new BadRequestException("La hora de finalización debe ser posterior a la de inicio.");
        }
        if (!inicio.toLocalDate().equals(fin.toLocalDate())) {
            throw new BadRequestException("La cita debe iniciar y terminar el mismo día.");
        }
        long minutos = Duration.between(inicio, fin).toMinutes();
        if (minutos < 10 || minutos > 480) {
            throw new BadRequestException("La duración de la cita debe estar entre 10 minutos y 8 horas.");
        }
        if (inicio.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("No se pueden programar citas en fechas u horas pasadas.");
        }
        int dia = inicio.getDayOfWeek().getValue();
        List<HorarioMedico> franjas = horarioRepository.findByMedicoAndDiaSemanaAndActivoTrue(medico, dia);
        boolean dentro = franjas.stream().anyMatch(h -> !inicio.toLocalTime().isBefore(h.getHoraInicio())
                && !fin.toLocalTime().isAfter(h.getHoraFin()));
        if (!dentro) {
            StringBuilder disp = new StringBuilder();
            franjas.forEach(h -> disp.append(HORA.format(h.getHoraInicio())).append("-").append(HORA.format(h.getHoraFin())).append(" "));
            throw new ConflictException("El horario solicitado no está dentro de la disponibilidad del veterinario"
                    + (franjas.isEmpty() ? " (no atiende ese día)." : " (ese día atiende: " + disp.toString().trim() + ")."));
        }
        List<Cita> cruceMedico = citaRepository.traslapesMedico(medico.getId(), inicio, fin,
                Constantes.CITA_ESTADOS_OCUPAN, excluirId);
        if (!cruceMedico.isEmpty()) {
            Cita x = cruceMedico.get(0);
            throw new ConflictException("El veterinario ya tiene una cita de " + HORA.format(x.getFechaHora()) + " a "
                    + HORA.format(x.getFechaHoraFin()) + " (" + x.getMascota().getNombreMascota() + ").");
        }
        List<Cita> cruceMascota = citaRepository.traslapesMascota(mascota.getMascotaId(), inicio, fin,
                Constantes.CITA_ESTADOS_OCUPAN, excluirId);
        if (!cruceMascota.isEmpty()) {
            Cita x = cruceMascota.get(0);
            throw new ConflictException("La mascota " + mascota.getNombreMascota() + " ya tiene una cita de "
                    + HORA.format(x.getFechaHora()) + " a " + HORA.format(x.getFechaHoraFin()) + " con "
                    + x.getMedico().nombreCompleto() + ".");
        }
    }

    private void validarBasico(CitaRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información de la cita es obligatoria.");
        }
        Validar.idValido(rq.getMascotaId(), "mascotaId");
        Validar.obligatorio(rq.getFechaHora(), "fecha y hora de inicio");
        Validar.texto(rq.getMotivo(), "motivo de la consulta", 2000);
    }

    private LocalDateTime calcularFin(LocalDateTime inicio, LocalDateTime fin, Tarifa tarifa) {
        if (fin != null) {
            return fin;
        }
        int minutos = tarifa == null ? Constantes.CITA_DURACION_DEFECTO : tarifa.getDuracionMinutos();
        return inicio.plusMinutes(minutos);
    }

    private Tarifa tarifa(Long tarifaId) {
        if (tarifaId == null) {
            return null;
        }
        Tarifa t = tarifaRepository.findById(tarifaId).orElseThrow(() -> new NotFoundException("El tipo de consulta no existe."));
        if (!Boolean.TRUE.equals(t.getActivo())) {
            throw new ConflictException("El tipo de consulta seleccionado está inactivo.");
        }
        return t;
    }

    private Mascota mascotaActiva(Integer mascotaId) {
        Mascota m = mascotaRepository.findById(mascotaId).orElseThrow(() -> new NotFoundException("La mascota no existe."));
        if (!Boolean.TRUE.equals(m.getActivo())) {
            throw new ConflictException("La mascota está inactiva.");
        }
        if (m.getCliente() == null || !Boolean.TRUE.equals(m.getCliente().getActivo())) {
            throw new ConflictException("El propietario de la mascota no existe o está inactivo.");
        }
        return m;
    }

    /** Bloquea el registro del veterinario para serializar la asignación de su agenda. */
    private Medico bloquearMedico(Long medicoId) {
        Medico m = entityManager.find(Medico.class, medicoId, LockModeType.PESSIMISTIC_WRITE);
        if (m == null) {
            throw new NotFoundException("El veterinario no existe.");
        }
        return m;
    }

    private Long medicoAutenticado() {
        UsuarioActual u = ContextoUsuario.obtener();
        if (u.medicoId() == null) {
            throw new ForbiddenException("El usuario no está asociado a un veterinario.");
        }
        return u.medicoId();
    }

    /** Un MEDICO sólo puede ver/modificar citas de su propia agenda. */
    private void verificarAccesoMedico(Cita c) {
        UsuarioActual u = ContextoUsuario.obtener();
        if (Roles.MEDICO.equals(u.perfilCodigo()) && !c.getMedico().getId().equals(u.medicoId())) {
            throw new ForbiddenException("La cita pertenece a la agenda de otro veterinario.");
        }
    }

    private void validarRango(LocalDate ini, LocalDate fin) {
        if (ini.isAfter(fin)) {
            throw new BadRequestException("La fecha inicial no puede ser mayor a la fecha final.");
        }
    }

    private void registrar(Cita c, String accion, String estadoAnterior, String estadoNuevo,
                           LocalDateTime fechaAnterior, LocalDateTime fechaNueva, String observacion) {
        CitaHistorial h = new CitaHistorial();
        h.setCita(c);
        h.setAccion(accion);
        h.setEstadoAnterior(estadoAnterior);
        h.setEstadoNuevo(estadoNuevo);
        h.setFechaAnterior(fechaAnterior);
        h.setFechaNueva(fechaNueva);
        h.setObservacion(observacion);
        h.setUsuario(authService.usuarioActual());
        h.setFecha(LocalDateTime.now());
        historialRepository.save(h);
    }
}
