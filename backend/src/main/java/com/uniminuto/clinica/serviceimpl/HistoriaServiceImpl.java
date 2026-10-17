package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.EstadoCita;
import com.uniminuto.clinica.entity.EstadoHistoria;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.CitaDisponibleRs;
import com.uniminuto.clinica.models.HistoriaFiltroRq;
import com.uniminuto.clinica.models.HistoriaRq;
import com.uniminuto.clinica.models.HistoriaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.repository.AnotacionRepository;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.repository.HistoriaClinicaRepository;
import com.uniminuto.clinica.repository.HistoriaSpecification;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.HistoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Implementación de las reglas de negocio de las historias clínicas.
 * Todas las validaciones críticas se hacen aquí, en el backend.
 */
@Service
public class HistoriaServiceImpl implements HistoriaService {

    /**
     * Tamaño máximo de página permitido.
     */
    private static final int TAMANO_MAXIMO_PAGINA = 100;

    /**
     * Longitud máxima del motivo.
     */
    private static final int MAXIMO_MOTIVO = 500;

    /**
     * Longitud máxima del diagnóstico y de las observaciones.
     */
    private static final int MAXIMO_TEXTO = 1000;

    /**
     * Columnas ordenables y su campo real en la entidad.
     */
    private static final Map<String, String> CAMPOS_ORDEN = Map.of(
            "fecha", "fechaHora",
            "hora", "fechaHora",
            "cliente", "mascota.cliente.nombres",
            "mascota", "mascota.nombreMascota",
            "medico", "medico.nombres",
            "diagnostico", "diagnostico",
            "estado", "estado");

    /**
     * Repositorio de historias clínicas.
     */
    @Autowired
    private HistoriaClinicaRepository historiaRepository;

    /**
     * Repositorio de anotaciones (para contarlas).
     */
    @Autowired
    private AnotacionRepository anotacionRepository;

    /**
     * Repositorio de citas.
     */
    @Autowired
    private CitaRepository citaRepository;

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
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<HistoriaRs> listarHistorias(HistoriaFiltroRq filtro) {
        if (filtro.getPage() < 0) {
            throw new BadRequestException("La página no puede ser negativa");
        }
        if (filtro.getSize() < 1 || filtro.getSize() > TAMANO_MAXIMO_PAGINA) {
            throw new BadRequestException("El tamaño de página debe estar entre 1 y "
                    + TAMANO_MAXIMO_PAGINA);
        }
        if (filtro.getDesde() != null && filtro.getHasta() != null
                && filtro.getDesde().isAfter(filtro.getHasta())) {
            throw new BadRequestException(
                    "La fecha inicial no puede ser posterior a la fecha final");
        }

        String campo = CAMPOS_ORDEN.getOrDefault(
                filtro.getOrden() == null ? "" : filtro.getOrden().trim().toLowerCase(),
                "fechaHora");
        Sort.Direction sentido = "asc".equalsIgnoreCase(filtro.getDireccion())
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(filtro.getPage(), filtro.getSize(),
                Sort.by(sentido, campo).and(Sort.by(sentido, "historiaId")));

        return PaginaRs.desde(historiaRepository
                .findAll(HistoriaSpecification.conFiltros(
                        filtro.getTexto(), this.convertirEstado(filtro.getEstado()),
                        filtro.getClienteId(), filtro.getMascotaId(),
                        filtro.getMedicoId(), filtro.getDesde(), filtro.getHasta()),
                        pageable)
                .map(this::convertirARespuesta));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public HistoriaRs consultarHistoria(Long historiaId) {
        return this.convertirARespuesta(historiaRepository.findById(historiaId)
                .orElseThrow(() -> new NotFoundException(
                        "La historia clínica no existe")));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarHistoria(HistoriaRq rq) {
        // Paso 1. Datos obligatorios.
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos de la historia clínica");
        }
        if (rq.getClienteId() == null) {
            throw new BadRequestException("Debe seleccionar un cliente");
        }
        if (rq.getMascotaId() == null) {
            throw new BadRequestException("Debe seleccionar una mascota");
        }
        if (rq.getCitaId() == null) {
            throw new BadRequestException("Debe seleccionar la cita atendida que origina la historia");
        }
        if (rq.getDiagnostico() == null || rq.getDiagnostico().isBlank()) {
            throw new BadRequestException("El diagnóstico es obligatorio");
        }
        if (rq.getDiagnostico().trim().length() > MAXIMO_TEXTO) {
            throw new BadRequestException("El diagnóstico no puede superar los "
                    + MAXIMO_TEXTO + " caracteres");
        }
        if (rq.getObservaciones() != null
                && rq.getObservaciones().trim().length() > MAXIMO_TEXTO) {
            throw new BadRequestException("Las observaciones no pueden superar los "
                    + MAXIMO_TEXTO + " caracteres");
        }

        // Paso 2. Cliente y mascota existen y la mascota es del cliente.
        Cliente cliente = clienteRepository.findById(rq.getClienteId())
                .orElseThrow(() -> new NotFoundException(
                        "El cliente seleccionado no existe"));
        Mascota mascota = mascotaRepository.findById(rq.getMascotaId())
                .orElseThrow(() -> new NotFoundException(
                        "La mascota seleccionada no existe"));
        if (!mascota.getCliente().getClienteId().equals(cliente.getClienteId())) {
            throw new BadRequestException(
                    "La mascota seleccionada no pertenece al cliente");
        }

        // Paso 3. Cita asociada: atendida, de la misma mascota y sin historia previa.
        Cita cita = citaRepository.findById(rq.getCitaId())
                .orElseThrow(() -> new NotFoundException("La cita no existe"));
        if (cita.getEstado() != EstadoCita.ATENDIDA) {
            throw new ConflictException("Solo se puede generar la historia de "
                    + "una cita que ya fue atendida");
        }
        if (!cita.getMascota().getMascotaId().equals(mascota.getMascotaId())) {
            throw new BadRequestException(
                    "La cita seleccionada no corresponde a la mascota");
        }
        if (historiaRepository.existsByCita_CitaId(cita.getCitaId())) {
            throw new ConflictException(
                    "La cita ya tiene una historia clínica asociada");
        }

        // Paso 4. Veterinario (por defecto el de la cita) y motivo (por defecto el de la cita).
        Long medicoId = rq.getMedicoId() != null ? rq.getMedicoId() : cita.getMedico().getId();
        Medico medico = medicoRepository.findById(medicoId)
                .orElseThrow(() -> new NotFoundException(
                        "El veterinario seleccionado no existe"));

        String motivo = rq.getMotivo() != null && !rq.getMotivo().isBlank()
                ? rq.getMotivo().trim()
                : cita.getMotivo();
        if (motivo.length() > MAXIMO_MOTIVO) {
            throw new BadRequestException("El motivo no puede superar los "
                    + MAXIMO_MOTIVO + " caracteres");
        }

        // Paso 5. Guardar.
        HistoriaClinica historia = new HistoriaClinica();
        historia.setMascota(mascota);
        historia.setMedico(medico);
        historia.setCita(cita);
        historia.setFechaHora(cita.getFechaHora());
        historia.setMotivo(motivo);
        historia.setDiagnostico(rq.getDiagnostico().trim());
        historia.setObservaciones(rq.getObservaciones() == null
                || rq.getObservaciones().isBlank() ? null : rq.getObservaciones().trim());
        historia.setEstado(EstadoHistoria.ABIERTA);
        historia.setFechaCreacion(LocalDateTime.now());
        historiaRepository.save(historia);

        return MiRespuestaRS.de(201, "Historia clínica registrada correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS cerrarHistoria(Long historiaId) {
        HistoriaClinica historia = historiaRepository.findById(historiaId)
                .orElseThrow(() -> new NotFoundException("La historia clínica no existe"));
        if (historia.getEstado() == EstadoHistoria.CERRADA) {
            throw new ConflictException("La historia clínica ya está cerrada");
        }
        historia.setEstado(EstadoHistoria.CERRADA);
        historiaRepository.save(historia);
        return MiRespuestaRS.de(200, "Historia clínica cerrada correctamente");
    }

    /**
     * Convierte el estado recibido como texto en el enum, validándolo.
     *
     * @param estado texto del estado (vacío = sin filtro).
     * @return estado, o null si no se envió.
     */
    private EstadoHistoria convertirEstado(String estado) {
        if (estado == null || estado.isBlank()) {
            return null;
        }
        try {
            return EstadoHistoria.valueOf(estado.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("El estado '" + estado + "' no es válido. Use ABIERTA o CERRADA");
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<CitaDisponibleRs> listarCitasDisponibles(Integer mascotaId) {
        if (mascotaId == null) {
            throw new BadRequestException("Debe indicar la mascota");
        }
        if (!mascotaRepository.existsById(mascotaId)) {
            throw new NotFoundException("La mascota seleccionada no existe");
        }
        return historiaRepository
                .buscarCitasSinHistoria(mascotaId, EstadoCita.ATENDIDA)
                .stream()
                .map(cita -> {
                    CitaDisponibleRs rs = new CitaDisponibleRs();
                    rs.setCitaId(cita.getCitaId());
                    rs.setFecha(cita.getFechaHora().toLocalDate());
                    rs.setHora(cita.getFechaHora().toLocalTime());
                    rs.setMotivo(cita.getMotivo());
                    rs.setMedicoId(cita.getMedico().getId());
                    rs.setMedicoNombre(cita.getMedico().getNombres() + " "
                            + cita.getMedico().getApellidos());
                    return rs;
                })
                .toList();
    }

    /**
     * Convierte una historia de la base de datos en la respuesta para el cliente.
     *
     * @param historia historia a convertir.
     * @return respuesta con sus datos y el total de anotaciones.
     */
    private HistoriaRs convertirARespuesta(HistoriaClinica historia) {
        Mascota mascota = historia.getMascota();
        Cliente cliente = mascota.getCliente();
        Medico medico = historia.getMedico();

        HistoriaRs rs = new HistoriaRs();
        rs.setHistoriaId(historia.getHistoriaId());
        rs.setFecha(historia.getFechaHora().toLocalDate());
        rs.setHora(historia.getFechaHora().toLocalTime());
        rs.setClienteId(cliente.getClienteId());
        rs.setClienteNombre(cliente.getNombres() + " " + cliente.getApellidos());
        rs.setMascotaId(mascota.getMascotaId());
        rs.setMascotaNombre(mascota.getNombreMascota());
        rs.setMedicoId(medico.getId());
        rs.setMedicoNombre(medico.getNombres() + " " + medico.getApellidos());
        rs.setCitaId(historia.getCita() == null ? null : historia.getCita().getCitaId());
        rs.setMotivo(historia.getMotivo());
        rs.setDiagnostico(historia.getDiagnostico());
        rs.setObservaciones(historia.getObservaciones());
        rs.setEstado(historia.getEstado().name());
        rs.setTotalAnotaciones(
                anotacionRepository.countByHistoria_HistoriaId(historia.getHistoriaId()));
        rs.setFechaCreacion(historia.getFechaCreacion());
        return rs;
    }
}
