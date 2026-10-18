package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.enums.EstadoCita;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.BusinessRuleException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.ResourceNotFoundException;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.CitaRs;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.repository.spec.CitaSpecifications;
import com.uniminuto.clinica.service.CitaService;
import com.uniminuto.clinica.utils.PaginacionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;

/**
 * Implementa las reglas de negocio de las citas médicas. Todas las reglas críticas se validan
 * aquí (backend), no solo en Angular.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@Service
public class CitaServiceImpl implements CitaService {

    /**
     * Margen en minutos, antes y después de la hora de una cita, en el que el veterinario
     * (o la mascota) no puede tener otra cita. El rango es inclusivo en ambos extremos.
     */
    private static final long MARGEN_MINUTOS = 15;

    /** Longitud máxima permitida para el motivo de la consulta. */
    private static final int MAX_MOTIVO = 500;

    /** Campos por los que se permite ordenar, asociados a la ruta real en la entidad (lista blanca). */
    private static final Map<String, String> CAMPOS_ORDEN = Map.of(
            "fechaHora", "fechaHora",
            "estado", "estado",
            "cliente", "cliente.nombres",
            "mascota", "mascota.nombreMascota",
            "medico", "medico.nombres");

    /** Repositorio de citas. */
    @Autowired
    private CitaRepository citaRepository;

    /** Repositorio de clientes. */
    @Autowired
    private ClienteRepository clienteRepository;

    /** Repositorio de mascotas. */
    @Autowired
    private MascotaRepository mascotaRepository;

    /** Repositorio de médicos veterinarios. */
    @Autowired
    private MedicoRepository medicoRepository;

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public PaginaRs<CitaRs> listarCitas(int page, int size, String sortBy, String sortDir, String texto,
                                        String estado, Long clienteId, Integer mascotaId, Long medicoId,
                                        LocalDate fechaDesde, LocalDate fechaHasta) {
        if (estado != null && !estado.isBlank()) {
            EstadoCita.desde(estado);
        }
        if (fechaDesde != null && fechaHasta != null && fechaHasta.isBefore(fechaDesde)) {
            throw new BadRequestException("La fecha final no puede ser anterior a la fecha inicial.");
        }
        Pageable pageable = PaginacionUtil.construir(page, size, sortBy, sortDir, CAMPOS_ORDEN);
        LocalDateTime desde = fechaDesde == null ? null : fechaDesde.atStartOfDay();
        LocalDateTime hastaExclusivo = fechaHasta == null ? null : fechaHasta.plusDays(1).atStartOfDay();

        Page<Cita> resultado = citaRepository.findAll(
                CitaSpecifications.conFiltros(texto, estado, clienteId, mascotaId, medicoId, desde, hastaExclusivo),
                pageable);

        return new PaginaRs<>(resultado.getContent().stream().map(this::aRespuesta).toList(),
                resultado.getNumber(), resultado.getSize(),
                resultado.getTotalElements(), resultado.getTotalPages());
    }

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public CitaRs obtenerCita(Long id) {
        return aRespuesta(buscarCita(id));
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public CitaRs crearCita(CitaRq rq) {
        validarCamposObligatorios(rq);
        LocalDateTime fechaHora = normalizar(rq.getFechaHora());

        EstadoCita estado = (rq.getEstado() == null || rq.getEstado().isBlank())
                ? EstadoCita.PENDIENTE : EstadoCita.desde(rq.getEstado());
        if (estado == EstadoCita.ATENDIDA || estado == EstadoCita.CANCELADA) {
            throw new BusinessRuleException("Una cita nueva no puede crearse como atendida ni como cancelada.");
        }

        Cliente cliente = clienteRepository.findById(rq.getClienteId())
                .orElseThrow(() -> new ResourceNotFoundException("El cliente seleccionado no existe."));
        Mascota mascota = mascotaRepository.findById(rq.getMascotaId())
                .orElseThrow(() -> new ResourceNotFoundException("La mascota seleccionada no existe."));
        Medico medico = medicoRepository.findById(rq.getMedicoId())
                .orElseThrow(() -> new ResourceNotFoundException("El veterinario seleccionado no existe."));

        if (!mascota.getCliente().getClienteId().equals(cliente.getClienteId())) {
            throw new BusinessRuleException("La mascota seleccionada no pertenece al cliente indicado.");
        }
        validarFechaNoPasada(fechaHora);
        validarDisponibilidad(medico.getId(), mascota.getMascotaId(), fechaHora, -1L);

        Cita cita = new Cita();
        cita.setCliente(cliente);
        cita.setMascota(mascota);
        cita.setMedico(medico);
        cita.setFechaHora(fechaHora);
        cita.setMotivo(rq.getMotivo().trim());
        cita.setEstado(estado.name());
        return aRespuesta(citaRepository.save(cita));
    }

    /**
     * {@inheritDoc}
     * <p>
     * Restricciones (y su justificación):
     * </p>
     * <ul>
     *   <li>CANCELADA: no se modifica; solo se recupera con la operación explícita de reactivar.</li>
     *   <li>ATENDIDA: no se modifica; es información histórica de la atención.</li>
     *   <li>CONFIRMADA: no cambia fecha, hora ni veterinario, porque el cliente ya confirmó esos datos.</li>
     *   <li>Cliente y mascota nunca cambian: alterarlos rompería la trazabilidad; se cancela y se crea otra.</li>
     * </ul>
     */
    @Override
    @Transactional
    public CitaRs actualizarCita(Long id, CitaRq rq) {
        Cita cita = buscarCita(id);
        EstadoCita actual = estadoActual(cita);

        if (actual == EstadoCita.CANCELADA) {
            throw new BusinessRuleException("La cita está cancelada y no puede modificarse. Use la opción de reactivar.");
        }
        if (actual == EstadoCita.ATENDIDA) {
            throw new BusinessRuleException("La cita ya fue atendida y su información histórica no puede modificarse.");
        }

        validarCamposObligatorios(rq);
        LocalDateTime fechaHora = normalizar(rq.getFechaHora());

        if (!cita.getCliente().getClienteId().equals(rq.getClienteId())
                || !cita.getMascota().getMascotaId().equals(rq.getMascotaId())) {
            throw new BusinessRuleException(
                    "No es posible cambiar el cliente ni la mascota de una cita. Cancele la cita y cree una nueva.");
        }

        Medico medico = medicoRepository.findById(rq.getMedicoId())
                .orElseThrow(() -> new ResourceNotFoundException("El veterinario seleccionado no existe."));

        boolean cambiaAgenda = !fechaHora.equals(cita.getFechaHora())
                || !medico.getId().equals(cita.getMedico().getId());
        if (cambiaAgenda) {
            if (actual == EstadoCita.CONFIRMADA) {
                throw new BusinessRuleException("Una cita confirmada no puede cambiar de fecha, hora ni veterinario. "
                        + "Solo puede modificarse el motivo o cambiarse su estado.");
            }
            validarFechaNoPasada(fechaHora);
            validarDisponibilidad(medico.getId(), cita.getMascota().getMascotaId(), fechaHora, cita.getId());
            cita.setFechaHora(fechaHora);
            cita.setMedico(medico);
        }
        cita.setMotivo(rq.getMotivo().trim());

        if (rq.getEstado() != null && !rq.getEstado().isBlank()) {
            EstadoCita nuevo = EstadoCita.desde(rq.getEstado());
            if (nuevo != actual) {
                validarTransicion(actual, nuevo);
                cita.setEstado(nuevo.name());
            }
        }
        return aRespuesta(citaRepository.save(cita));
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public CitaRs cambiarEstado(Long id, String estado) {
        Cita cita = buscarCita(id);
        EstadoCita nuevo = EstadoCita.desde(estado);
        EstadoCita actual = estadoActual(cita);
        if (nuevo != actual) {
            validarTransicion(actual, nuevo);
            cita.setEstado(nuevo.name());
            citaRepository.save(cita);
        }
        return aRespuesta(cita);
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public CitaRs reactivarCita(Long id) {
        Cita cita = buscarCita(id);
        if (estadoActual(cita) != EstadoCita.CANCELADA) {
            throw new BusinessRuleException("Solo se pueden reactivar las citas que están canceladas.");
        }
        validarFechaNoPasada(cita.getFechaHora());
        validarDisponibilidad(cita.getMedico().getId(), cita.getMascota().getMascotaId(),
                cita.getFechaHora(), cita.getId());
        cita.setEstado(EstadoCita.PENDIENTE.name());
        return aRespuesta(citaRepository.save(cita));
    }

    /**
     * Busca una cita o lanza un error 404.
     *
     * @param id Identificador de la cita.
     * @return La cita encontrada.
     */
    private Cita buscarCita(Long id) {
        return citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La cita solicitada no existe."));
    }

    /**
     * Obtiene el estado de una cita; si por datos antiguos viene vacío se asume PENDIENTE.
     *
     * @param cita Cita a consultar.
     * @return Estado actual.
     */
    private EstadoCita estadoActual(Cita cita) {
        return (cita.getEstado() == null || cita.getEstado().isBlank())
                ? EstadoCita.PENDIENTE : EstadoCita.desde(cita.getEstado());
    }

    /**
     * Valida que el estado destino sea alcanzable desde el estado actual.
     *
     * @param actual Estado actual.
     * @param nuevo  Estado solicitado.
     */
    private void validarTransicion(EstadoCita actual, EstadoCita nuevo) {
        if (!actual.transicionesPermitidas().contains(nuevo)) {
            throw new BusinessRuleException("No se puede cambiar una cita de " + actual + " a " + nuevo + ".");
        }
    }

    /**
     * Valida los campos obligatorios y la longitud del motivo.
     *
     * @param rq Datos recibidos.
     */
    private void validarCamposObligatorios(CitaRq rq) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos de la cita.");
        }
        if (rq.getClienteId() == null) {
            throw new BadRequestException("El cliente es obligatorio.");
        }
        if (rq.getMascotaId() == null) {
            throw new BadRequestException("La mascota es obligatoria.");
        }
        if (rq.getMedicoId() == null) {
            throw new BadRequestException("El veterinario es obligatorio.");
        }
        if (rq.getFechaHora() == null) {
            throw new BadRequestException("La fecha y la hora son obligatorias.");
        }
        if (rq.getMotivo() == null || rq.getMotivo().isBlank()) {
            throw new BadRequestException("El motivo de la consulta es obligatorio.");
        }
        if (rq.getMotivo().trim().length() > MAX_MOTIVO) {
            throw new BadRequestException("El motivo no puede superar los " + MAX_MOTIVO + " caracteres.");
        }
    }

    /**
     * Quita segundos y nanosegundos para comparar y guardar siempre a nivel de minuto.
     *
     * @param fechaHora Fecha y hora original.
     * @return Fecha y hora truncada al minuto.
     */
    private LocalDateTime normalizar(LocalDateTime fechaHora) {
        return fechaHora.truncatedTo(ChronoUnit.MINUTES);
    }

    /**
     * Impide agendar citas en fechas y horas anteriores al momento actual.
     *
     * @param fechaHora Fecha y hora a validar.
     */
    private void validarFechaNoPasada(LocalDateTime fechaHora) {
        if (fechaHora.isBefore(LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES))) {
            throw new BusinessRuleException("No se pueden registrar citas en fechas u horas anteriores a la actual.");
        }
    }

    /**
     * Verifica que ni el veterinario ni la mascota tengan otra cita activa dentro del margen de
     * {@value #MARGEN_MINUTOS} minutos antes y después. Las citas canceladas no ocupan agenda.
     *
     * @param medicoId  Veterinario.
     * @param mascotaId Mascota.
     * @param fechaHora Fecha y hora solicitada.
     * @param excluirId Cita que se excluye de la comparación (-1 si es nueva).
     */
    private void validarDisponibilidad(Long medicoId, Integer mascotaId, LocalDateTime fechaHora, Long excluirId) {
        LocalDateTime desde = fechaHora.minusMinutes(MARGEN_MINUTOS);
        LocalDateTime hasta = fechaHora.plusMinutes(MARGEN_MINUTOS);
        if (citaRepository.existeCruceMedico(medicoId, desde, hasta, excluirId)) {
            throw new ConflictException("El veterinario no está disponible en ese horario: ya tiene una cita "
                    + "dentro de un margen de " + MARGEN_MINUTOS + " minutos.");
        }
        if (citaRepository.existeCruceMascota(mascotaId, desde, hasta, excluirId)) {
            throw new ConflictException("La mascota ya tiene una cita programada en ese horario.");
        }
    }

    /**
     * Convierte la entidad en el objeto de respuesta con los nombres ya resueltos.
     *
     * @param cita Entidad a convertir.
     * @return Respuesta lista para enviar al frontend.
     */
    private CitaRs aRespuesta(Cita cita) {
        CitaRs rs = new CitaRs();
        rs.setId(cita.getId());
        rs.setClienteId(cita.getCliente().getClienteId());
        rs.setClienteNombre(cita.getCliente().getNombres() + " " + cita.getCliente().getApellidos());
        rs.setMascotaId(cita.getMascota().getMascotaId());
        rs.setMascotaNombre(cita.getMascota().getNombreMascota());
        rs.setMedicoId(cita.getMedico().getId());
        rs.setMedicoNombre(cita.getMedico().getNombres() + " " + cita.getMedico().getApellidos());
        rs.setFechaHora(cita.getFechaHora());
        rs.setMotivo(cita.getMotivo());
        rs.setEstado(cita.getEstado());
        return rs;
    }
}
