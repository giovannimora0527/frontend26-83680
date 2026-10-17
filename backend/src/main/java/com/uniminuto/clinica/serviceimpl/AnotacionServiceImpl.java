package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Anotacion;
import com.uniminuto.clinica.entity.EstadoHistoria;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.AnotacionFiltroRq;
import com.uniminuto.clinica.models.AnotacionRq;
import com.uniminuto.clinica.models.AnotacionRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.repository.AnotacionRepository;
import com.uniminuto.clinica.repository.HistoriaClinicaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.AnotacionService;
import com.uniminuto.clinica.util.Validaciones;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Implementación de las reglas de negocio de las anotaciones.
 */
@Service
public class AnotacionServiceImpl implements AnotacionService {

    /**
     * Tamaño máximo de página permitido.
     */
    private static final int TAMANO_MAXIMO_PAGINA = 100;

    /**
     * Longitud máxima de cada campo de texto de una anotación.
     */
    private static final int MAXIMO_TEXTO = 1000;

    /**
     * Columnas ordenables y su campo real en la entidad.
     */
    private static final Map<String, String> CAMPOS_ORDEN = Map.of(
            "fecha", "fechaCreacion",
            "medico", "medico.nombres");

    /**
     * Repositorio de anotaciones.
     */
    @Autowired
    private AnotacionRepository anotacionRepository;

    /**
     * Repositorio de historias clínicas.
     */
    @Autowired
    private HistoriaClinicaRepository historiaRepository;

    /**
     * Repositorio de veterinarios.
     */
    @Autowired
    private MedicoRepository medicoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<AnotacionRs> listarAnotaciones(AnotacionFiltroRq filtro) {
        if (filtro.getHistoriaId() == null) {
            throw new BadRequestException("Debe indicar la historia clínica");
        }
        if (!historiaRepository.existsById(filtro.getHistoriaId())) {
            throw new NotFoundException("La historia clínica no existe");
        }
        if (filtro.getPage() < 0) {
            throw new BadRequestException("La página no puede ser negativa");
        }
        if (filtro.getSize() < 1 || filtro.getSize() > TAMANO_MAXIMO_PAGINA) {
            throw new BadRequestException("El tamaño de página debe estar entre 1 y "
                    + TAMANO_MAXIMO_PAGINA);
        }

        String campo = CAMPOS_ORDEN.getOrDefault(
                filtro.getOrden() == null ? "" : filtro.getOrden().trim().toLowerCase(),
                "fechaCreacion");
        Sort.Direction sentido = "asc".equalsIgnoreCase(filtro.getDireccion())
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(filtro.getPage(), filtro.getSize(),
                Sort.by(sentido, campo).and(Sort.by(sentido, "anotacionId")));

        Long historiaId = filtro.getHistoriaId();
        String texto = filtro.getTexto();
        Specification<Anotacion> spec = (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            Join<Anotacion, Medico> medico = root.join("medico");
            filtros.add(cb.equal(root.get("historia").get("historiaId"), historiaId));
            if (texto != null && !texto.isBlank()) {
                String patron = "%" + texto.trim().toLowerCase() + "%";
                filtros.add(cb.or(
                        cb.like(cb.lower(root.<String>get("descripcion")), patron),
                        cb.like(cb.lower(root.<String>get("diagnostico")), patron),
                        cb.like(cb.lower(cb.coalesce(root.<String>get("observacion"), "")), patron),
                        cb.like(cb.lower(cb.concat(
                                cb.concat(medico.<String>get("nombres"), " "),
                                medico.<String>get("apellidos"))), patron)));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };

        return PaginaRs.desde(anotacionRepository.findAll(spec, pageable)
                .map(this::convertirARespuesta));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public AnotacionRs consultarAnotacion(Long anotacionId) {
        return this.convertirARespuesta(anotacionRepository.findById(anotacionId)
                .orElseThrow(() -> new NotFoundException("La anotación no existe")));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarAnotacion(AnotacionRq rq) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos de la anotación");
        }
        if (rq.getHistoriaId() == null) {
            throw new BadRequestException("Debe indicar la historia clínica");
        }
        if (rq.getMedicoId() == null) {
            throw new BadRequestException("Debe seleccionar el veterinario autor");
        }
        String descripcion = this.textoObligatorio(rq.getDescripcion(), "La descripción");
        String diagnostico = this.textoObligatorio(rq.getDiagnostico(), "El diagnóstico o evolución");
        String observacion = rq.getObservacion() == null || rq.getObservacion().isBlank()
                ? null : rq.getObservacion().trim();
        if (observacion != null && observacion.length() > MAXIMO_TEXTO) {
            throw new BadRequestException("La observación no puede superar los "
                    + MAXIMO_TEXTO + " caracteres");
        }

        HistoriaClinica historia = historiaRepository.findById(rq.getHistoriaId())
                .orElseThrow(() -> new NotFoundException(
                        "La historia clínica no existe"));
        if (historia.getEstado() == EstadoHistoria.CERRADA) {
            throw new ConflictException("La historia clínica está cerrada y no admite nuevas anotaciones");
        }
        Medico medico = medicoRepository.findById(rq.getMedicoId())
                .orElseThrow(() -> new NotFoundException(
                        "El veterinario seleccionado no existe"));

        Anotacion anotacion = new Anotacion();
        anotacion.setHistoria(historia);
        anotacion.setMedico(medico);
        anotacion.setDescripcion(descripcion);
        anotacion.setObservacion(observacion);
        anotacion.setDiagnostico(diagnostico);
        anotacion.setFechaCreacion(LocalDateTime.now());
        anotacionRepository.save(anotacion);

        return MiRespuestaRS.de(201, "Anotación registrada correctamente");
    }

    /**
     * Valida un campo de texto obligatorio y devuelve su valor sin espacios sobrantes.
     *
     * @param valor  texto recibido.
     * @param nombre nombre del campo para el mensaje de error.
     * @return texto validado.
     */
    private String textoObligatorio(String valor, String nombre) {
        return Validaciones.obligatorio(valor, nombre, MAXIMO_TEXTO);
    }

    /**
     * Convierte una anotación en la respuesta que ve el cliente.
     *
     * @param anotacion anotación a convertir.
     * @return respuesta con sus datos.
     */
    private AnotacionRs convertirARespuesta(Anotacion anotacion) {
        AnotacionRs rs = new AnotacionRs();
        rs.setAnotacionId(anotacion.getAnotacionId());
        rs.setHistoriaId(anotacion.getHistoria().getHistoriaId());
        rs.setMedicoId(anotacion.getMedico().getId());
        rs.setMedicoNombre(anotacion.getMedico().getNombres() + " "
                + anotacion.getMedico().getApellidos());
        rs.setDescripcion(anotacion.getDescripcion());
        rs.setObservacion(anotacion.getObservacion());
        rs.setDiagnostico(anotacion.getDiagnostico());
        rs.setFechaCreacion(anotacion.getFechaCreacion());
        return rs;
    }
}
