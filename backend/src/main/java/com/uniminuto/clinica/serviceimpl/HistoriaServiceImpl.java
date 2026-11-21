package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.AnotacionHistoria;
import com.uniminuto.clinica.entity.HistoriaMedica;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ForbiddenException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.AnotacionHistoriaRq;
import com.uniminuto.clinica.models.HistoriaMedicaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.AnotacionHistoriaRepository;
import com.uniminuto.clinica.repository.HistoriaMedicaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.security.ContextoUsuario;
import com.uniminuto.clinica.security.UsuarioActual;
import com.uniminuto.clinica.service.HistoriaService;
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Consulta de historias clínicas y anotaciones de evolución (adendas). Una
 * historia cerrada no se edita; las anotaciones se agregan sin modificarla.
 */
@Service
public class HistoriaServiceImpl implements HistoriaService {

    @Autowired
    private HistoriaMedicaRepository historiaRepository;

    @Autowired
    private AnotacionHistoriaRepository anotacionRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<HistoriaMedicaRs> listar(boolean soloPropias) {
        UsuarioActual u = ContextoUsuario.obtener();
        List<HistoriaMedica> historias = soloPropias && u.medicoId() != null
                ? historiaRepository.findByMedico_IdOrderByFechaHoraDesc(u.medicoId())
                : historiaRepository.findAllByOrderByFechaHoraDesc();
        return historias.stream().map(this::conAnotaciones).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<HistoriaMedicaRs> porMascota(Integer mascotaId) {
        Validar.idValido(mascotaId, "mascotaId");
        return historiaRepository.findByMascota_MascotaIdOrderByFechaHoraDesc(mascotaId).stream()
                .map(this::conAnotaciones).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public HistoriaMedicaRs consultar(Long historiaId) {
        Validar.idValido(historiaId, "historiaId");
        return conAnotaciones(historiaRepository.findById(historiaId)
                .orElseThrow(() -> new NotFoundException("La historia clínica no existe.")));
    }

    @Override
    @Transactional
    public MiRespuestaRS agregarAnotacion(AnotacionHistoriaRq rq) {
        if (rq == null) {
            throw new BadRequestException("La anotación es obligatoria.");
        }
        Validar.idValido(rq.getHistoriaId(), "historiaId");
        HistoriaMedica h = historiaRepository.findById(rq.getHistoriaId())
                .orElseThrow(() -> new NotFoundException("La historia clínica no existe."));
        UsuarioActual u = ContextoUsuario.obtener();
        if (u.medicoId() == null) {
            throw new ForbiddenException("Sólo un veterinario puede registrar anotaciones clínicas.");
        }
        Medico medico = medicoRepository.findById(u.medicoId())
                .orElseThrow(() -> new NotFoundException("El veterinario no existe."));
        AnotacionHistoria a = new AnotacionHistoria();
        a.setHistoria(h);
        a.setCita(h.getCita());
        a.setMedico(medico);
        a.setFecha(LocalDateTime.now());
        a.setDescripcion(Validar.texto(rq.getDescripcion(), "descripción", 4000));
        a.setDiagnostico(Validar.textoOpcional(rq.getDiagnostico(), "diagnóstico", 4000));
        a.setObservaciones(Validar.textoOpcional(rq.getObservaciones(), "observaciones", 4000));
        anotacionRepository.save(a);
        return MiRespuestaRS.creado("Anotación registrada en la historia clínica.", a.getId());
    }

    private HistoriaMedicaRs conAnotaciones(HistoriaMedica h) {
        return new HistoriaMedicaRs(h, anotacionRepository.findByHistoria_IdOrderByFechaDesc(h.getId()));
    }
}
