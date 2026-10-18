package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.AnotacionHistoria;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.enums.EstadoHistoria;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.BusinessRuleException;
import com.uniminuto.clinica.exception.ResourceNotFoundException;
import com.uniminuto.clinica.models.AnotacionRq;
import com.uniminuto.clinica.models.AnotacionRs;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.repository.AnotacionHistoriaRepository;
import com.uniminuto.clinica.repository.HistoriaClinicaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.repository.spec.AnotacionHistoriaSpecifications;
import com.uniminuto.clinica.service.AnotacionHistoriaService;
import com.uniminuto.clinica.utils.PaginacionUtil;
import com.uniminuto.clinica.utils.ValidacionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Implementa las reglas de negocio de las anotaciones: solo se agregan a historias abiertas,
 * por un veterinario existente, y la fecha y hora siempre las asigna el servidor.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@Service
public class AnotacionHistoriaServiceImpl implements AnotacionHistoriaService {

    /** Campos permitidos para ordenar el listado (nombre público -> ruta en la entidad). */
    private static final Map<String, String> CAMPOS_ORDEN = Map.of(
            "fecha", "fecha",
            "medico", "medico.nombres");

    /** Repositorio de anotaciones. */
    @Autowired
    private AnotacionHistoriaRepository anotacionRepository;

    /** Repositorio de historias clínicas. */
    @Autowired
    private HistoriaClinicaRepository historiaRepository;

    /** Repositorio de médicos veterinarios. */
    @Autowired
    private MedicoRepository medicoRepository;

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public PaginaRs<AnotacionRs> listarAnotaciones(int page, int size, String sortBy, String sortDir, String texto,
                                                   Long historiaId, Integer mascotaId, Long medicoId,
                                                   LocalDate fechaDesde, LocalDate fechaHasta) {
        if (fechaDesde != null && fechaHasta != null && fechaHasta.isBefore(fechaDesde)) {
            throw new BadRequestException("La fecha final no puede ser anterior a la fecha inicial.");
        }
        if (historiaId != null && !historiaRepository.existsById(historiaId)) {
            throw new ResourceNotFoundException("La historia clínica solicitada no existe.");
        }
        LocalDateTime desde = fechaDesde == null ? null : fechaDesde.atStartOfDay();
        LocalDateTime hasta = fechaHasta == null ? null : fechaHasta.plusDays(1).atStartOfDay();

        Page<AnotacionHistoria> resultado = anotacionRepository.findAll(
                AnotacionHistoriaSpecifications.conFiltros(texto, historiaId, mascotaId, medicoId, desde, hasta),
                PaginacionUtil.construir(page, size, sortBy, sortDir, CAMPOS_ORDEN));

        return new PaginaRs<>(resultado.getContent().stream().map(this::aRespuesta).toList(),
                resultado.getNumber(), resultado.getSize(),
                resultado.getTotalElements(), resultado.getTotalPages());
    }

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public AnotacionRs obtenerAnotacion(Long id) {
        return aRespuesta(anotacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La anotación solicitada no existe.")));
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public AnotacionRs crearAnotacion(AnotacionRq rq) {
        ValidacionUtil.requerido(rq, "Debe enviar los datos de la anotación.");
        ValidacionUtil.requerido(rq.getHistoriaId(), "La historia clínica es obligatoria.");
        ValidacionUtil.requerido(rq.getMedicoId(), "El veterinario es obligatorio.");
        String descripcion = ValidacionUtil.textoObligatorio(rq.getDescripcion(), "descripción", 255);
        String observacion = ValidacionUtil.textoObligatorio(rq.getObservacion(), "observación", 2000);
        String evolucion = ValidacionUtil.textoObligatorio(rq.getDiagnosticoEvolucion(), "diagnóstico o evolución", 2000);

        HistoriaClinica historia = historiaRepository.findById(rq.getHistoriaId())
                .orElseThrow(() -> new ResourceNotFoundException("La historia clínica seleccionada no existe."));
        Medico medico = medicoRepository.findById(rq.getMedicoId())
                .orElseThrow(() -> new ResourceNotFoundException("El veterinario seleccionado no existe."));

        if (EstadoHistoria.CERRADA.name().equalsIgnoreCase(historia.getEstado())) {
            throw new BusinessRuleException("La historia clínica está cerrada y no admite nuevas anotaciones.");
        }

        AnotacionHistoria anotacion = new AnotacionHistoria();
        anotacion.setHistoria(historia);
        anotacion.setMedico(medico);
        anotacion.setFecha(LocalDateTime.now());
        anotacion.setDescripcion(descripcion);
        anotacion.setObservacion(observacion);
        anotacion.setDiagnosticoEvolucion(evolucion);
        return aRespuesta(anotacionRepository.save(anotacion));
    }

    /**
     * Convierte la entidad en el objeto de respuesta.
     *
     * @param a Entidad.
     * @return Respuesta.
     */
    private AnotacionRs aRespuesta(AnotacionHistoria a) {
        AnotacionRs rs = new AnotacionRs();
        rs.setId(a.getId());
        rs.setHistoriaId(a.getHistoria().getId());
        rs.setMedicoId(a.getMedico().getId());
        rs.setMedicoNombre(a.getMedico().getNombres() + " " + a.getMedico().getApellidos());
        rs.setFecha(a.getFecha());
        rs.setDescripcion(a.getDescripcion());
        rs.setObservacion(a.getObservacion());
        rs.setDiagnosticoEvolucion(a.getDiagnosticoEvolucion());
        return rs;
    }
}
