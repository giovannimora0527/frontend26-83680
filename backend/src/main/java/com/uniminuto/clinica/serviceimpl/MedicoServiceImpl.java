package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.entity.EstadoCita;
import com.uniminuto.clinica.entity.HorarioMedico;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.HorarioRq;
import com.uniminuto.clinica.models.HorarioRs;
import com.uniminuto.clinica.models.MedicoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.EspecializacionRepository;
import com.uniminuto.clinica.repository.HorarioMedicoRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.repository.UsuarioRepository;
import com.uniminuto.clinica.service.MedicoService;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Implementación de las reglas de negocio de los veterinarios: datos
 * obligatorios válidos, especialización existente, y documento y registro
 * profesional únicos.
 */
@Service
public class MedicoServiceImpl implements MedicoService {

    /**
     * Tipos de documento aceptados para un veterinario.
     */
    private static final List<String> TIPOS_DOCUMENTO = List.of("CC", "CE", "PA");

    /**
     * Número de documento: 5 a 20 letras o números.
     */
    private static final Pattern DOCUMENTO = Pattern.compile("^[A-Z0-9]{5,20}$");

    /**
     * Registro profesional: 3 a 50 letras, números o guiones.
     */
    private static final Pattern REGISTRO = Pattern.compile("^[A-Z0-9-]{3,50}$");

    /**
     * Teléfono: 7 a 20 dígitos, espacios y "+" inicial.
     */
    private static final Pattern TELEFONO = Pattern.compile("^\\+?[0-9 ]{7,20}$");

    /**
     * Identificador que no existe, para reutilizar las consultas "IdNot" al crear.
     */
    private static final Long SIN_ID = -1L;

    /**
     * Repositorio de veterinarios.
     */
    @Autowired
    private MedicoRepository medicoRepository;

    /**
     * Repositorio de especializaciones.
     */
    @Autowired
    private EspecializacionRepository especializacionRepository;

    /**
     * Repositorio de usuarios.
     */
    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Repositorio de citas, para no inactivar veterinarios con agenda pendiente.
     */
    @Autowired
    private CitaRepository citaRepository;

    /**
     * Repositorio de horarios.
     */
    @Autowired
    private HorarioMedicoRepository horarioRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Medico> listarMedicos() {
        return medicoRepository.findAll(Sort.by("nombres").and(Sort.by("apellidos")));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Medico consultarMedico(Long id) {
        return medicoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("El veterinario no existe"));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarMedico(MedicoRq rq) {
        Medico medico = new Medico();
        this.aplicarDatos(medico, rq, SIN_ID);
        medicoRepository.save(medico);
        return MiRespuestaRS.de(201, "Veterinario registrado correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarMedico(Long id, MedicoRq rq) {
        Medico medico = this.consultarMedico(id);
        this.aplicarDatos(medico, rq, id);
        medicoRepository.save(medico);
        return MiRespuestaRS.de(200, "Veterinario actualizado correctamente");
    }

    /**
     * Valida los datos (incluida la unicidad, antes de modificar la entidad
     * para que Hibernate no la guarde antes de tiempo) y los copia al veterinario.
     *
     * @param medico veterinario a completar.
     * @param rq     datos recibidos.
     * @param id     veterinario que se edita (SIN_ID al crear).
     */
    private void aplicarDatos(Medico medico, MedicoRq rq, Long id) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos del veterinario");
        }
        String tipo = Validaciones.obligatorio(rq.getTipoDocumento(), "El tipo de documento", 10).toUpperCase();
        if (!TIPOS_DOCUMENTO.contains(tipo)) {
            throw new BadRequestException("El tipo de documento no es válido. Use: " + String.join(", ", TIPOS_DOCUMENTO));
        }
        String numero = Validaciones.conPatron(
                rq.getNumeroDocumento() == null ? null : rq.getNumeroDocumento().trim().toUpperCase(),
                "El número de documento", 20, DOCUMENTO,
                "El número de documento debe tener entre 5 y 20 letras o números, sin espacios ni puntos");
        String nombres = Validaciones.conPatron(rq.getNombres(), "El nombre", 100,
                Validaciones.SOLO_LETRAS, "El nombre solo puede contener letras");
        String apellidos = Validaciones.conPatron(rq.getApellidos(), "El apellido", 100,
                Validaciones.SOLO_LETRAS, "El apellido solo puede contener letras");
        String telefono = Validaciones.opcional(rq.getTelefono(), "El teléfono", 20);
        if (telefono != null && !TELEFONO.matcher(telefono).matches()) {
            throw new BadRequestException("El teléfono debe tener entre 7 y 20 dígitos");
        }
        String registro = Validaciones.conPatron(
                rq.getRegistroProfesional() == null ? null : rq.getRegistroProfesional().trim().toUpperCase(),
                "El registro profesional", 50, REGISTRO,
                "El registro profesional debe tener de 3 a 50 letras, números o guiones");
        if (rq.getEspecializacionId() == null) {
            throw new BadRequestException("Debe seleccionar la especialización");
        }
        Especializacion especializacion = especializacionRepository.findById(rq.getEspecializacionId())
                .orElseThrow(() -> new NotFoundException("La especialización seleccionada no existe"));

        this.validarUsuario(rq.getUsuarioId(), id);
        if (medicoRepository.existsByTipoDocumentoAndNumeroDocumentoAndIdNot(tipo, numero, id)) {
            throw new ConflictException("Ya existe un veterinario con el documento " + tipo + " " + numero);
        }
        if (medicoRepository.existsByRegistroProfesionalIgnoreCaseAndIdNot(registro, id)) {
            throw new ConflictException("Ya existe un veterinario con el registro profesional " + registro);
        }

        medico.setTipoDocumento(tipo);
        medico.setNumeroDocumento(numero);
        medico.setNombres(nombres);
        medico.setApellidos(apellidos);
        medico.setTelefono(telefono);
        medico.setRegistroProfesional(registro);
        medico.setEspecializacion(especializacion);
        medico.setUsuarioId(rq.getUsuarioId());
        if (rq.getDuracionCitaMin() != null) {
            if (rq.getDuracionCitaMin() < 10 || rq.getDuracionCitaMin() > 240 || rq.getDuracionCitaMin() % 5 != 0) {
                throw new BadRequestException("La duración de la cita debe estar entre 10 y 240 minutos, en múltiplos de 5");
            }
            medico.setDuracionCitaMin(rq.getDuracionCitaMin());
        }
    }

    /**
     * Valida que el usuario enlazado exista, sea veterinario y no esté asignado a otro médico.
     *
     * @param usuarioId usuario recibido (puede ser nulo).
     * @param id        veterinario que se edita (SIN_ID al crear).
     */
    private void validarUsuario(Integer usuarioId, Long id) {
        if (usuarioId == null) {
            return;
        }
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("El usuario seleccionado no existe"));
        if (!"VETERINARIO".equals(usuario.getRol())) {
            throw new BadRequestException("El usuario seleccionado no tiene el rol de veterinario");
        }
        if (medicoRepository.existsByUsuarioIdAndIdNot(usuarioId, id)) {
            throw new ConflictException("El usuario seleccionado ya está enlazado a otro veterinario");
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS activarMedico(Long id) {
        Medico medico = this.consultarMedico(id);
        if (Boolean.TRUE.equals(medico.getActivo())) {
            return MiRespuestaRS.de(200, "El veterinario ya está activo");
        }
        medico.setActivo(Boolean.TRUE);
        medicoRepository.save(medico);
        return MiRespuestaRS.de(200, "Veterinario activado; ya puede recibir citas");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS inactivarMedico(Long id) {
        Medico medico = this.consultarMedico(id);
        if (!Boolean.TRUE.equals(medico.getActivo())) {
            return MiRespuestaRS.de(200, "El veterinario ya está inactivo");
        }
        long pendientes = citaRepository.countByMedico_IdAndEstadoInAndFechaHoraAfter(id,
                List.of(EstadoCita.PENDIENTE, EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA), LocalDateTime.now());
        if (pendientes > 0) {
            throw new ConflictException("El veterinario tiene " + pendientes
                    + " citas futuras sin atender; reprográmelas con otro veterinario o cancélelas antes de inactivarlo");
        }
        medico.setActivo(Boolean.FALSE);
        medicoRepository.save(medico);
        return MiRespuestaRS.de(200, "Veterinario inactivado; no recibirá citas nuevas");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<HorarioRs> listarHorarios(Long id) {
        this.consultarMedico(id);
        return horarioRepository.findByMedico_IdOrderByDiaSemanaAscHoraInicioAsc(id).stream()
                .filter(h -> Boolean.TRUE.equals(h.getActivo()))
                .map(h -> {
                    HorarioRs rs = new HorarioRs();
                    rs.setHorarioId(h.getHorarioId());
                    rs.setDiaSemana(h.getDiaSemana());
                    rs.setHoraInicio(h.getHoraInicio());
                    rs.setHoraFin(h.getHoraFin());
                    return rs;
                }).toList();
    }

    /**
     * {@inheritDoc}
     * <p>
     * Cada franja debe tener un día válido y durar al menos 30 minutos; las
     * franjas de un mismo día no pueden cruzarse. Las citas ya agendadas se
     * conservan aunque queden fuera del nuevo horario.
     * </p>
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarHorarios(Long id, List<HorarioRq> franjas) {
        Medico medico = this.consultarMedico(id);
        if (franjas == null) {
            throw new BadRequestException("Debe enviar el horario");
        }
        if (franjas.size() > 50) {
            throw new BadRequestException("El horario admite máximo 50 franjas");
        }
        List<HorarioRq> ordenadas = new ArrayList<>(franjas);
        for (HorarioRq f : ordenadas) {
            if (f == null || f.getDiaSemana() == null || f.getHoraInicio() == null || f.getHoraFin() == null) {
                throw new BadRequestException("Cada franja debe indicar el día, la hora de inicio y la hora de fin");
            }
            if (f.getDiaSemana() < 1 || f.getDiaSemana() > 7) {
                throw new BadRequestException("El día de la semana debe estar entre 1 (lunes) y 7 (domingo)");
            }
            if (!f.getHoraFin().isAfter(f.getHoraInicio()) || f.getHoraInicio().plusMinutes(30).isAfter(f.getHoraFin())) {
                throw new BadRequestException("Cada franja debe durar al menos 30 minutos y terminar después de empezar ("
                        + f.getHoraInicio() + "–" + f.getHoraFin() + ")");
            }
        }
        ordenadas.sort(Comparator.comparing(HorarioRq::getDiaSemana).thenComparing(HorarioRq::getHoraInicio));
        for (int i = 1; i < ordenadas.size(); i++) {
            HorarioRq a = ordenadas.get(i - 1);
            HorarioRq b = ordenadas.get(i);
            if (a.getDiaSemana().equals(b.getDiaSemana()) && b.getHoraInicio().isBefore(a.getHoraFin())) {
                throw new BadRequestException("Las franjas " + a.getHoraInicio() + "–" + a.getHoraFin() + " y "
                        + b.getHoraInicio() + "–" + b.getHoraFin() + " del mismo día se cruzan");
            }
        }
        horarioRepository.borrarDelMedico(id);
        horarioRepository.flush();
        LocalDateTime ahora = LocalDateTime.now();
        for (HorarioRq f : ordenadas) {
            HorarioMedico h = new HorarioMedico();
            h.setMedico(medico);
            h.setDiaSemana(f.getDiaSemana());
            h.setHoraInicio(f.getHoraInicio().withSecond(0).withNano(0));
            h.setHoraFin(f.getHoraFin().withSecond(0).withNano(0));
            h.setActivo(Boolean.TRUE);
            h.setFechaCreacion(ahora);
            horarioRepository.save(h);
        }
        return MiRespuestaRS.de(200, ordenadas.isEmpty()
                ? "Horario eliminado: el veterinario no tendrá disponibilidad para citas nuevas"
                : "Horario guardado (" + ordenadas.size() + " franjas)");
    }
}

