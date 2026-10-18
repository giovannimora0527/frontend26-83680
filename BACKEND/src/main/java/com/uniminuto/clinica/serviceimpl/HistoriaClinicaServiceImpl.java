package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.enums.EstadoCita;
import com.uniminuto.clinica.enums.EstadoHistoria;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.BusinessRuleException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.ResourceNotFoundException;
import com.uniminuto.clinica.models.HistoriaClinicaDetalleRs;
import com.uniminuto.clinica.models.HistoriaClinicaRq;
import com.uniminuto.clinica.models.HistoriaClinicaRs;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.repository.HistoriaClinicaRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.repository.spec.HistoriaClinicaSpecifications;
import com.uniminuto.clinica.service.HistoriaClinicaService;
import com.uniminuto.clinica.utils.PaginacionUtil;
import com.uniminuto.clinica.utils.ValidacionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;

/**
 * Implementa las reglas de negocio de las historias clínicas.
 * <p>
 * Reglas principales: la historia nace de una cita ATENDIDA, solo hay una historia por cita,
 * la mascota debe pertenecer al cliente y a la cita, y una historia cerrada no admite cambios.
 * </p>
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Service
public class HistoriaClinicaServiceImpl implements HistoriaClinicaService {

    /** Campos permitidos para ordenar el listado (nombre público -> ruta en la entidad). */
    private static final Map<String, String> CAMPOS_ORDEN = Map.of(
            "fechaHora", "fechaHora",
            "estado", "estado",
            "cliente", "cliente.nombres",
            "mascota", "mascota.nombreMascota",
            "medico", "medico.nombres",
            "motivo", "motivoConsulta");

    /** Repositorio de historias clínicas. */
    @Autowired
    private HistoriaClinicaRepository historiaRepository;

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
    public PaginaRs<HistoriaClinicaRs> listarHistorias(int page, int size, String sortBy, String sortDir,
                                                       String texto, String estado, Long clienteId,
                                                       Integer mascotaId, Long medicoId,
                                                       LocalDate fechaDesde, LocalDate fechaHasta) {
        if (estado != null && !estado.isBlank()) {
            validarEstado(estado);
        }
        if (fechaDesde != null && fechaHasta != null && fechaHasta.isBefore(fechaDesde)) {
            throw new BadRequestException("La fecha final no puede ser anterior a la fecha inicial.");
        }
        LocalDateTime desde = fechaDesde == null ? null : fechaDesde.atStartOfDay();
        LocalDateTime hasta = fechaHasta == null ? null : fechaHasta.plusDays(1).atStartOfDay();

        Page<HistoriaClinica> resultado = historiaRepository.findAll(
                HistoriaClinicaSpecifications.conFiltros(texto, estado, clienteId, mascotaId, medicoId, desde, hasta),
                PaginacionUtil.construir(page, size, sortBy, sortDir, CAMPOS_ORDEN));

        return new PaginaRs<>(resultado.getContent().stream().map(this::aResumen).toList(),
                resultado.getNumber(), resultado.getSize(),
                resultado.getTotalElements(), resultado.getTotalPages());
    }

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public HistoriaClinicaDetalleRs obtenerHistoria(Long id) {
        return aDetalle(buscar(id));
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public HistoriaClinicaDetalleRs crearHistoria(HistoriaClinicaRq rq) {
        ValidacionUtil.requerido(rq, "Debe enviar los datos de la historia clínica.");
        ValidacionUtil.requerido(rq.getClienteId(), "El cliente es obligatorio.");
        ValidacionUtil.requerido(rq.getMascotaId(), "La mascota es obligatoria.");
        ValidacionUtil.requerido(rq.getCitaId(), "La cita es obligatoria.");
        ValidacionUtil.requerido(rq.getMedicoId(), "El veterinario es obligatorio.");
        String motivo = ValidacionUtil.textoObligatorio(rq.getMotivoConsulta(), "motivo de consulta", 1000);
        String diagnostico = ValidacionUtil.textoObligatorio(rq.getDiagnostico(), "diagnóstico", 2000);
        String observaciones = ValidacionUtil.textoOpcional(rq.getObservaciones(), "observaciones", 2000);

        Cliente cliente = clienteRepository.findById(rq.getClienteId())
                .orElseThrow(() -> new ResourceNotFoundException("El cliente seleccionado no existe."));
        Mascota mascota = mascotaRepository.findById(rq.getMascotaId())
                .orElseThrow(() -> new ResourceNotFoundException("La mascota seleccionada no existe."));
        Cita cita = citaRepository.findById(rq.getCitaId())
                .orElseThrow(() -> new ResourceNotFoundException("La cita seleccionada no existe."));
        Medico medico = medicoRepository.findById(rq.getMedicoId())
                .orElseThrow(() -> new ResourceNotFoundException("El veterinario seleccionado no existe."));

        if (!mascota.getCliente().getClienteId().equals(cliente.getClienteId())) {
            throw new BusinessRuleException("La mascota seleccionada no pertenece al cliente indicado.");
        }
        if (!cita.getCliente().getClienteId().equals(cliente.getClienteId())
                || !cita.getMascota().getMascotaId().equals(mascota.getMascotaId())) {
            throw new BusinessRuleException("La cita indicada no corresponde al cliente y la mascota seleccionados.");
        }
        if (!EstadoCita.ATENDIDA.name().equalsIgnoreCase(cita.getEstado())) {
            throw new BusinessRuleException("Solo una cita atendida puede generar una historia clínica.");
        }
        if (historiaRepository.existePorCita(cita.getId())) {
            throw new ConflictException("Esta cita ya tiene una historia clínica registrada.");
        }

        LocalDateTime ahora = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);
        LocalDateTime fechaHora = rq.getFechaHora() == null ? ahora : rq.getFechaHora().truncatedTo(ChronoUnit.MINUTES);
        if (fechaHora.isAfter(ahora)) {
            throw new BusinessRuleException("La fecha de la consulta no puede ser futura.");
        }

        HistoriaClinica historia = new HistoriaClinica();
        historia.setCliente(cliente);
        historia.setMascota(mascota);
        historia.setCita(cita);
        historia.setMedico(medico);
        historia.setFechaHora(fechaHora);
        historia.setMotivoConsulta(motivo);
        historia.setDiagnostico(diagnostico);
        historia.setObservaciones(observaciones);
        historia.setEstado(EstadoHistoria.ABIERTA.name());
        historia.setFechaCreacion(LocalDateTime.now());
        return aDetalle(historiaRepository.save(historia));
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public HistoriaClinicaDetalleRs cerrarHistoria(Long id) {
        HistoriaClinica historia = buscar(id);
        if (EstadoHistoria.CERRADA.name().equalsIgnoreCase(historia.getEstado())) {
            throw new BusinessRuleException("La historia clínica ya está cerrada.");
        }
        historia.setEstado(EstadoHistoria.CERRADA.name());
        return aDetalle(historiaRepository.save(historia));
    }

    /**
     * Busca una historia o lanza un error 404.
     *
     * @param id Identificador de la historia.
     * @return La historia encontrada.
     */
    private HistoriaClinica buscar(Long id) {
        return historiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La historia clínica solicitada no existe."));
    }

    /**
     * Verifica que el texto sea un estado de historia válido.
     *
     * @param estado Texto recibido.
     */
    private void validarEstado(String estado) {
        try {
            EstadoHistoria.valueOf(estado.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("El estado '" + estado + "' no es válido. Valores permitidos: ABIERTA, CERRADA.");
        }
    }

    /**
     * Convierte la entidad en el resumen que se muestra en el listado.
     *
     * @param h Entidad.
     * @return Resumen.
     */
    private HistoriaClinicaRs aResumen(HistoriaClinica h) {
        HistoriaClinicaRs rs = new HistoriaClinicaRs();
        rs.setId(h.getId());
        rs.setFechaHora(h.getFechaHora());
        rs.setMascotaId(h.getMascota().getMascotaId());
        rs.setMascotaNombre(h.getMascota().getNombreMascota());
        rs.setClienteId(h.getCliente().getClienteId());
        rs.setClienteNombre(h.getCliente().getNombres() + " " + h.getCliente().getApellidos());
        rs.setMedicoId(h.getMedico().getId());
        rs.setMedicoNombre(h.getMedico().getNombres() + " " + h.getMedico().getApellidos());
        rs.setMotivoConsulta(h.getMotivoConsulta());
        rs.setEstado(h.getEstado());
        return rs;
    }

    /**
     * Convierte la entidad en el detalle completo.
     *
     * @param h Entidad.
     * @return Detalle.
     */
    private HistoriaClinicaDetalleRs aDetalle(HistoriaClinica h) {
        HistoriaClinicaDetalleRs rs = new HistoriaClinicaDetalleRs();
        rs.setId(h.getId());
        rs.setCitaId(h.getCita().getId());
        rs.setFechaHora(h.getFechaHora());
        rs.setMascotaId(h.getMascota().getMascotaId());
        rs.setMascotaNombre(h.getMascota().getNombreMascota());
        rs.setClienteId(h.getCliente().getClienteId());
        rs.setClienteNombre(h.getCliente().getNombres() + " " + h.getCliente().getApellidos());
        rs.setMedicoId(h.getMedico().getId());
        rs.setMedicoNombre(h.getMedico().getNombres() + " " + h.getMedico().getApellidos());
        rs.setMotivoConsulta(h.getMotivoConsulta());
        rs.setDiagnostico(h.getDiagnostico());
        rs.setObservaciones(h.getObservaciones());
        rs.setEstado(h.getEstado());
        rs.setFechaCreacion(h.getFechaCreacion());
        return rs;
    }
}
