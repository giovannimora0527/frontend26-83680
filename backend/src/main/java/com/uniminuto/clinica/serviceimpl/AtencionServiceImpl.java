package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.AtencionServicio;
import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.CitaHistorial;
import com.uniminuto.clinica.entity.HistoriaMedica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Tarifa;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.ForbiddenException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.AtencionRs;
import com.uniminuto.clinica.models.HistoriaMedicaRs;
import com.uniminuto.clinica.models.HistoriaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.ServicioRq;
import com.uniminuto.clinica.repository.AnotacionHistoriaRepository;
import com.uniminuto.clinica.repository.AtencionServicioRepository;
import com.uniminuto.clinica.repository.CitaHistorialRepository;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.FormulaMedicaRepository;
import com.uniminuto.clinica.repository.HistoriaMedicaRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.TarifaRepository;
import com.uniminuto.clinica.security.ContextoUsuario;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.security.UsuarioActual;
import com.uniminuto.clinica.service.AtencionService;
import com.uniminuto.clinica.service.AuthService;
import com.uniminuto.clinica.utils.Constantes;
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Flujo de atención: iniciar (cita EN_ATENCION + historia ABIERTA) -> registrar
 * historia, servicios y fórmulas -> finalizar (historia CERRADA + cita ATENDIDA).
 */
@Service
public class AtencionServiceImpl implements AtencionService {

    private static final Set<String> SE_PUEDEN_INICIAR = Set.of(Constantes.CITA_PENDIENTE,
            Constantes.CITA_PROGRAMADA, Constantes.CITA_CONFIRMADA);

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private CitaHistorialRepository citaHistorialRepository;

    @Autowired
    private HistoriaMedicaRepository historiaRepository;

    @Autowired
    private AnotacionHistoriaRepository anotacionRepository;

    @Autowired
    private AtencionServicioRepository servicioRepository;

    @Autowired
    private FormulaMedicaRepository formulaRepository;

    @Autowired
    private TarifaRepository tarifaRepository;

    @Autowired
    private MascotaRepository mascotaRepository;

    @Autowired
    private AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public AtencionRs consultar(Long citaId) {
        Cita cita = cita(citaId, false);
        HistoriaMedica historia = historiaRepository.findByCita_Id(citaId).orElse(null);
        List<HistoriaMedicaRs> antecedentes = historiaRepository
                .findByMascota_MascotaIdOrderByFechaHoraDesc(cita.getMascota().getMascotaId()).stream()
                .filter(h -> !h.getCita().getId().equals(citaId))
                .map(h -> new HistoriaMedicaRs(h, anotacionRepository.findByHistoria_IdOrderByFechaDesc(h.getId())))
                .toList();
        return new AtencionRs(cita, historia, servicioRepository.findByCita_IdOrderByIdAsc(citaId),
                formulaRepository.findByCita_IdOrderByIdAsc(citaId), antecedentes);
    }

    @Override
    @Transactional
    public MiRespuestaRS iniciar(Long citaId) {
        Cita cita = cita(citaId, true);
        if (Constantes.CITA_EN_ATENCION.equals(cita.getEstado())) {
            return MiRespuestaRS.ok("La atención ya estaba iniciada.", cita.getId());
        }
        if (!SE_PUEDEN_INICIAR.contains(cita.getEstado())) {
            throw new ConflictException("No se puede iniciar la atención de una cita " + cita.getEstado().toLowerCase() + ".");
        }
        if (cita.getFechaHora().toLocalDate().isAfter(LocalDate.now())) {
            throw new ConflictException("La atención sólo se puede iniciar el día de la cita.");
        }
        Usuario usuario = authService.usuarioActual();
        LocalDateTime ahora = LocalDateTime.now();
        HistoriaMedica h = historiaRepository.findByCita_Id(citaId).orElseGet(HistoriaMedica::new);
        if (h.getId() == null) {
            h.setMascota(cita.getMascota());
            h.setCliente(cita.getCliente());
            h.setCita(cita);
            h.setMedico(cita.getMedico());
            h.setFechaHora(ahora);
            h.setMotivo(Validar.vacio(cita.getMotivo()) ? "Consulta" : cita.getMotivo());
            h.setPesoKg(cita.getMascota().getPesoKg());
            h.setEstado(Constantes.HISTORIA_ABIERTA);
            h.setFechaCreacion(ahora);
            historiaRepository.save(h);
        }
        if (cita.getTarifa() != null && !servicioRepository.existsByCita_IdAndTarifa_Id(citaId, cita.getTarifa().getId())) {
            AtencionServicio s = new AtencionServicio();
            s.setCita(cita);
            s.setTarifa(cita.getTarifa());
            s.setCantidad(1);
            s.setObservacion("Servicio principal de la cita");
            s.setUsuarioId(usuario.getUsuarioId());
            s.setFecha(ahora);
            servicioRepository.save(s);
        }
        String anterior = cita.getEstado();
        cita.setEstado(Constantes.CITA_EN_ATENCION);
        cita.setFechaModificacion(ahora);
        citaRepository.save(cita);
        registrarCita(cita, anterior, Constantes.CITA_EN_ATENCION, "Atención iniciada", usuario);
        return MiRespuestaRS.ok("Atención iniciada. Historia clínica abierta.", h.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS guardarHistoria(HistoriaRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información clínica es obligatoria.");
        }
        Cita cita = cita(rq.getCitaId(), true);
        HistoriaMedica h = historiaAbierta(cita);
        h.setMotivo(Validar.texto(rq.getMotivo(), "motivo de consulta", 4000));
        h.setSintomas(Validar.textoOpcional(rq.getSintomas(), "síntomas", 4000));
        h.setDiagnostico(Validar.textoOpcional(rq.getDiagnostico(), "diagnóstico", 4000));
        h.setObservaciones(Validar.textoOpcional(rq.getObservaciones(), "observaciones", 4000));
        h.setRecomendaciones(Validar.textoOpcional(rq.getRecomendaciones(), "recomendaciones", 4000));
        if (rq.getPesoKg() != null && (rq.getPesoKg().signum() <= 0 || rq.getPesoKg().compareTo(BigDecimal.valueOf(500)) > 0)) {
            throw new BadRequestException("El peso debe estar entre 0 y 500 kg.");
        }
        if (rq.getTemperaturaC() != null && (rq.getTemperaturaC().compareTo(BigDecimal.valueOf(30)) < 0
                || rq.getTemperaturaC().compareTo(BigDecimal.valueOf(45)) > 0)) {
            throw new BadRequestException("La temperatura debe estar entre 30 y 45 °C.");
        }
        h.setPesoKg(rq.getPesoKg());
        h.setTemperaturaC(rq.getTemperaturaC());
        historiaRepository.save(h);
        return MiRespuestaRS.ok("Historia clínica guardada.", h.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS agregarServicio(ServicioRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información del servicio es obligatoria.");
        }
        Cita cita = cita(rq.getCitaId(), true);
        historiaAbierta(cita);
        Validar.idValido(rq.getTarifaId(), "tarifaId");
        Tarifa t = tarifaRepository.findById(rq.getTarifaId()).orElseThrow(() -> new NotFoundException("La tarifa no existe."));
        if (!Boolean.TRUE.equals(t.getActivo())) {
            throw new ConflictException("La tarifa está inactiva.");
        }
        if (servicioRepository.existsByCita_IdAndTarifa_Id(cita.getId(), t.getId())) {
            throw new ConflictException("El servicio '" + t.getNombre() + "' ya está registrado en esta atención "
                    + "(no se cobra dos veces el mismo servicio). Ajuste la cantidad si aplica.");
        }
        AtencionServicio s = new AtencionServicio();
        s.setCita(cita);
        s.setTarifa(t);
        s.setCantidad(rq.getCantidad() == null ? 1 : Validar.entero(rq.getCantidad(), "cantidad", 1, 100));
        s.setObservacion(Validar.textoOpcional(rq.getObservacion(), "observación", 500));
        s.setUsuarioId(ContextoUsuario.obtener().usuarioId());
        s.setFecha(LocalDateTime.now());
        servicioRepository.save(s);
        return MiRespuestaRS.creado("Servicio agregado a la atención.", s.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS quitarServicio(Long servicioId) {
        Validar.idValido(servicioId, "servicioId");
        AtencionServicio s = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new NotFoundException("El servicio no existe."));
        Cita cita = cita(s.getCita().getId(), true);
        historiaAbierta(cita);
        servicioRepository.delete(s);
        return MiRespuestaRS.ok("Servicio retirado de la atención.");
    }

    @Override
    @Transactional
    public MiRespuestaRS finalizar(Long citaId) {
        Cita cita = cita(citaId, true);
        if (!Constantes.CITA_EN_ATENCION.equals(cita.getEstado())) {
            throw new ConflictException("Sólo se puede finalizar una cita en atención (estado actual: " + cita.getEstado() + ").");
        }
        HistoriaMedica h = historiaAbierta(cita);
        if (Validar.vacio(h.getDiagnostico())) {
            throw new ConflictException("Registre el diagnóstico antes de finalizar la atención.");
        }
        if (servicioRepository.findByCita_IdOrderByIdAsc(citaId).isEmpty()) {
            throw new ConflictException("Registre al menos un servicio prestado antes de finalizar (se usa en la factura).");
        }
        if (formulaRepository.countByCita_IdAndEstado(citaId, Constantes.FORMULA_BORRADOR) > 0) {
            throw new ConflictException("Hay fórmulas en borrador: confírmelas o anúlelas antes de finalizar.");
        }
        Usuario usuario = authService.usuarioActual();
        LocalDateTime ahora = LocalDateTime.now();
        h.setEstado(Constantes.HISTORIA_CERRADA);
        h.setFechaCierre(ahora);
        historiaRepository.save(h);
        if (h.getPesoKg() != null) {
            Mascota m = cita.getMascota();
            m.setPesoKg(h.getPesoKg());
            m.setFechaModificacion(ahora);
            mascotaRepository.save(m);
        }
        cita.setEstado(Constantes.CITA_ATENDIDA);
        cita.setFechaModificacion(ahora);
        citaRepository.save(cita);
        registrarCita(cita, Constantes.CITA_EN_ATENCION, Constantes.CITA_ATENDIDA, "Atención finalizada", usuario);
        return MiRespuestaRS.ok("Atención finalizada. La cita quedó ATENDIDA y lista para facturar.", cita.getId());
    }

    // ------------------------------------------------------------------ apoyo

    private Cita cita(Long citaId, boolean escritura) {
        Validar.idValido(citaId, "citaId");
        Cita c = citaRepository.findById(citaId).orElseThrow(() -> new NotFoundException("La cita no existe."));
        UsuarioActual u = ContextoUsuario.obtener();
        boolean esMedicoDeLaCita = Roles.MEDICO.equals(u.perfilCodigo()) && c.getMedico().getId().equals(u.medicoId());
        if (escritura && !esMedicoDeLaCita) {
            throw new ForbiddenException("Sólo el veterinario asignado puede atender esta cita.");
        }
        if (!escritura && Roles.MEDICO.equals(u.perfilCodigo()) && !esMedicoDeLaCita) {
            throw new ForbiddenException("La cita pertenece a la agenda de otro veterinario.");
        }
        return c;
    }

    private HistoriaMedica historiaAbierta(Cita cita) {
        HistoriaMedica h = historiaRepository.findByCita_Id(cita.getId())
                .orElseThrow(() -> new ConflictException("La atención no ha sido iniciada."));
        if (!Constantes.HISTORIA_ABIERTA.equals(h.getEstado())) {
            throw new ConflictException("La historia clínica de esta cita está cerrada y no se puede modificar.");
        }
        return h;
    }

    private void registrarCita(Cita c, String anterior, String nuevo, String obs, Usuario u) {
        CitaHistorial ch = new CitaHistorial();
        ch.setCita(c);
        ch.setAccion("CAMBIO_ESTADO");
        ch.setEstadoAnterior(anterior);
        ch.setEstadoNuevo(nuevo);
        ch.setObservacion(obs);
        ch.setUsuario(u);
        ch.setFecha(LocalDateTime.now());
        citaHistorialRepository.save(ch);
    }
}
