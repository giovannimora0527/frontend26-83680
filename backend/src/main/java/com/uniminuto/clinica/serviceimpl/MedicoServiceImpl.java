package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.entity.HorarioMedico;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.HorarioRq;
import com.uniminuto.clinica.models.MedicoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.EspecializacionRepository;
import com.uniminuto.clinica.repository.HorarioMedicoRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.MedicoService;
import com.uniminuto.clinica.utils.Constantes;
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
public class MedicoServiceImpl implements MedicoService {

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private EspecializacionRepository especializacionRepository;

    @Autowired
    private HorarioMedicoRepository horarioRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Override
    public List<Medico> listarMedicos(boolean soloActivos) {
        return soloActivos ? medicoRepository.findByEstadoTrueOrderByApellidosAsc()
                : medicoRepository.findAllByOrderByApellidosAsc();
    }

    @Override
    public Medico consultar(Long medicoId) {
        Validar.idValido(medicoId, "medicoId");
        return medicoRepository.findById(medicoId).orElseThrow(() -> new NotFoundException("El veterinario no existe."));
    }

    @Override
    public List<Medico> listarMedicosDisponiblesPorFecha(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        if (fechaInicio == null || fechaFin == null) {
            throw new BadRequestException("Las fechas no pueden ser nulas.");
        }
        if (!fechaInicio.isBefore(fechaFin)) {
            throw new BadRequestException("La fecha de inicio debe ser menor a la fecha de fin.");
        }
        return medicoRepository.findDisponiblesPorFecha(fechaInicio, fechaFin, Constantes.CITA_ESTADOS_OCUPAN);
    }

    @Override
    @Transactional
    public MiRespuestaRS guardarMedico(MedicoRq rq) {
        validar(rq);
        if (medicoRepository.existsByNumeroDocumento(rq.getNumeroDocumento().trim())) {
            throw new ConflictException("Ya existe un veterinario con el número de documento indicado.");
        }
        if (medicoRepository.existsByRegistroProfesional(rq.getRegistroProfesional().trim())) {
            throw new ConflictException("Ya existe un veterinario con el registro profesional indicado.");
        }
        Medico m = new Medico();
        mapear(m, rq);
        m.setEstado(Boolean.TRUE);
        medicoRepository.save(m);
        return MiRespuestaRS.creado("Veterinario registrado. Recuerde configurar sus horarios de disponibilidad.", m.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS actualizarMedico(MedicoRq rq) {
        validar(rq);
        Medico m = consultar(rq.getId());
        if (medicoRepository.existsByNumeroDocumentoAndIdNot(rq.getNumeroDocumento().trim(), m.getId())) {
            throw new ConflictException("Ya existe otro veterinario con el número de documento indicado.");
        }
        if (medicoRepository.existsByRegistroProfesionalAndIdNot(rq.getRegistroProfesional().trim(), m.getId())) {
            throw new ConflictException("Ya existe otro veterinario con el registro profesional indicado.");
        }
        mapear(m, rq);
        medicoRepository.save(m);
        return MiRespuestaRS.ok("Veterinario actualizado correctamente.", m.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS cambiarEstado(Long medicoId, boolean activo) {
        Medico m = consultar(medicoId);
        if (!activo) {
            long futuras = citaRepository.countByMedico_IdAndEstadoInAndFechaHoraAfter(medicoId,
                    Set.of(Constantes.CITA_PENDIENTE, Constantes.CITA_PROGRAMADA, Constantes.CITA_CONFIRMADA),
                    LocalDateTime.now());
            if (futuras > 0) {
                throw new ConflictException("El veterinario tiene " + futuras
                        + " cita(s) futura(s) activas. Reasígnelas o cancélelas antes de inactivarlo.");
            }
        }
        m.setEstado(activo);
        medicoRepository.save(m);
        return MiRespuestaRS.ok(activo ? "Veterinario activado." : "Veterinario inactivado.", medicoId);
    }

    @Override
    public List<HorarioMedico> listarHorarios(Long medicoId) {
        return horarioRepository.findByMedicoOrderByDiaSemanaAscHoraInicioAsc(consultar(medicoId));
    }

    @Override
    @Transactional
    public MiRespuestaRS guardarHorarios(HorarioRq rq) {
        if (rq == null || rq.getHorarios() == null) {
            throw new BadRequestException("Debe enviar la lista de horarios (puede estar vacía).");
        }
        Medico medico = consultar(rq.getMedicoId());
        List<HorarioRq.Bloque> bloques = new ArrayList<>(rq.getHorarios());
        for (HorarioRq.Bloque b : bloques) {
            Validar.entero(b.getDiaSemana(), "día de la semana", 1, 7);
            Validar.obligatorio(b.getHoraInicio(), "hora de inicio");
            Validar.obligatorio(b.getHoraFin(), "hora de fin");
            if (!b.getHoraInicio().isBefore(b.getHoraFin())) {
                throw new BadRequestException("La hora de inicio debe ser menor a la hora de fin.");
            }
        }
        bloques.sort(Comparator.comparing(HorarioRq.Bloque::getDiaSemana).thenComparing(HorarioRq.Bloque::getHoraInicio));
        for (int i = 1; i < bloques.size(); i++) {
            HorarioRq.Bloque anterior = bloques.get(i - 1);
            HorarioRq.Bloque actual = bloques.get(i);
            if (anterior.getDiaSemana().equals(actual.getDiaSemana())
                    && actual.getHoraInicio().isBefore(anterior.getHoraFin())) {
                throw new BadRequestException("Hay franjas superpuestas el día " + actual.getDiaSemana() + ".");
            }
        }
        horarioRepository.deleteByMedico(medico);
        horarioRepository.flush();
        for (HorarioRq.Bloque b : bloques) {
            HorarioMedico h = new HorarioMedico();
            h.setMedico(medico);
            h.setDiaSemana(b.getDiaSemana());
            h.setHoraInicio(b.getHoraInicio());
            h.setHoraFin(b.getHoraFin());
            h.setActivo(Boolean.TRUE);
            horarioRepository.save(h);
        }
        return MiRespuestaRS.ok("Horarios de disponibilidad actualizados.", medico.getId());
    }

    private void mapear(Medico m, MedicoRq rq) {
        Especializacion esp = especializacionRepository.findById(rq.getEspecializacionId())
                .orElseThrow(() -> new NotFoundException("La especialidad no existe."));
        if (!Boolean.TRUE.equals(esp.getActivo())) {
            throw new ConflictException("La especialidad seleccionada está inactiva.");
        }
        m.setTipoDocumento(rq.getTipoDocumento().trim().toUpperCase());
        m.setNumeroDocumento(rq.getNumeroDocumento().trim());
        m.setNombres(rq.getNombres().trim());
        m.setApellidos(rq.getApellidos().trim());
        m.setTelefono(Validar.limpiar(rq.getTelefono()));
        m.setEmail(Validar.limpiar(rq.getEmail()));
        m.setRegistroProfesional(rq.getRegistroProfesional().trim());
        m.setEspecializacion(esp);
    }

    private void validar(MedicoRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información del veterinario es obligatoria.");
        }
        Validar.enLista(rq.getTipoDocumento(), Set.of("CC", "CE", "PA", "PPT"), "tipo de documento");
        Validar.texto(rq.getNumeroDocumento(), "número de documento", 20);
        Validar.texto(rq.getNombres(), "nombres", 100);
        Validar.texto(rq.getApellidos(), "apellidos", 100);
        Validar.texto(rq.getRegistroProfesional(), "registro profesional", 50);
        Validar.textoOpcional(rq.getTelefono(), "teléfono", 20);
        String email = Validar.textoOpcional(rq.getEmail(), "email", 150);
        if (email != null && !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new BadRequestException("El correo electrónico no es válido.");
        }
        Validar.idValido(rq.getEspecializacionId(), "especializacionId");
    }
}
