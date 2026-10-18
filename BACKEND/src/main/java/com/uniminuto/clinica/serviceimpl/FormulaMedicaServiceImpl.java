package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.BusinessRuleException;
import com.uniminuto.clinica.exception.ResourceNotFoundException;
import com.uniminuto.clinica.models.FormulaDetalleRs;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.repository.FormulaMedicaRepository;
import com.uniminuto.clinica.repository.HistoriaClinicaRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.repository.spec.FormulaMedicaSpecifications;
import com.uniminuto.clinica.service.FormulaMedicaService;
import com.uniminuto.clinica.utils.PaginacionUtil;
import com.uniminuto.clinica.utils.ValidacionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Implementa las reglas de negocio de las fórmulas médicas.
 * <p>
 * Reglas principales: mascota, historia, veterinario y medicamento deben existir; la historia debe
 * ser de la misma mascota; la emisión no puede ser anterior a la consulta; dosis y duración válidas;
 * y las fórmulas se inactivan, nunca se eliminan físicamente.
 * </p>
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@Service
public class FormulaMedicaServiceImpl implements FormulaMedicaService {

    /** Dosis válida: número seguido de una unidad que empieza con letra (ej. "5 mg", "2.5ml"). */
    private static final Pattern PATRON_DOSIS = Pattern.compile("^\\s*(\\d+(?:[.,]\\d+)?)\\s*(\\p{L}.*)$");

    /** Duración mínima del tratamiento, en días. */
    private static final int DURACION_MINIMA = 1;

    /** Duración máxima del tratamiento, en días. */
    private static final int DURACION_MAXIMA = 365;

    /** Campos permitidos para ordenar el listado (nombre público -> ruta en la entidad). */
    private static final Map<String, String> CAMPOS_ORDEN = Map.of(
            "fechaCreacion", "fechaCreacionRegistro",
            "fechaEmision", "fechaEmision",
            "mascota", "mascota.nombreMascota",
            "medico", "medico.nombres",
            "medicamento", "medicamento.nombre",
            "estado", "activa");

    /** Repositorio de fórmulas. */
    @Autowired
    private FormulaMedicaRepository formulaRepository;

    /** Repositorio de historias clínicas. */
    @Autowired
    private HistoriaClinicaRepository historiaRepository;

    /** Repositorio de mascotas. */
    @Autowired
    private MascotaRepository mascotaRepository;

    /** Repositorio de médicos veterinarios. */
    @Autowired
    private MedicoRepository medicoRepository;

    /** Repositorio de medicamentos. */
    @Autowired
    private MedicamentoRepository medicamentoRepository;

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public PaginaRs<FormulaRs> listarFormulas(int page, int size, String sortBy, String sortDir, String texto,
                                              Integer mascotaId, Long medicoId, Long medicamentoId, Boolean activa,
                                              LocalDate fechaDesde, LocalDate fechaHasta) {
        if (fechaDesde != null && fechaHasta != null && fechaHasta.isBefore(fechaDesde)) {
            throw new BadRequestException("La fecha final no puede ser anterior a la fecha inicial.");
        }
        LocalDateTime desde = fechaDesde == null ? null : fechaDesde.atStartOfDay();
        LocalDateTime hasta = fechaHasta == null ? null : fechaHasta.plusDays(1).atStartOfDay();

        Page<FormulaMedica> resultado = formulaRepository.findAll(
                FormulaMedicaSpecifications.conFiltros(texto, mascotaId, medicoId, medicamentoId, activa, desde, hasta),
                PaginacionUtil.construir(page, size, sortBy, sortDir, CAMPOS_ORDEN));

        return new PaginaRs<>(resultado.getContent().stream().map(this::aResumen).toList(),
                resultado.getNumber(), resultado.getSize(),
                resultado.getTotalElements(), resultado.getTotalPages());
    }

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public FormulaDetalleRs obtenerFormula(Long id) {
        return aDetalle(buscar(id));
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public FormulaDetalleRs crearFormula(FormulaRq rq) {
        ValidacionUtil.requerido(rq, "Debe enviar los datos de la fórmula.");
        ValidacionUtil.requerido(rq.getMascotaId(), "La mascota es obligatoria.");
        ValidacionUtil.requerido(rq.getHistoriaId(), "La historia clínica (consulta) es obligatoria.");
        ValidacionUtil.requerido(rq.getMedicoId(), "El veterinario es obligatorio.");
        ValidacionUtil.requerido(rq.getMedicamentoId(), "El medicamento es obligatorio.");
        ValidacionUtil.requerido(rq.getFechaEmision(), "La fecha de emisión es obligatoria.");

        Mascota mascota = mascotaRepository.findById(rq.getMascotaId())
                .orElseThrow(() -> new ResourceNotFoundException("La mascota seleccionada no existe."));
        if (mascota.getCliente() == null) {
            throw new BusinessRuleException("La mascota seleccionada no pertenece a un cliente registrado.");
        }
        HistoriaClinica historia = historiaRepository.findById(rq.getHistoriaId())
                .orElseThrow(() -> new ResourceNotFoundException("La historia clínica seleccionada no existe."));
        Medico medico = medicoRepository.findById(rq.getMedicoId())
                .orElseThrow(() -> new ResourceNotFoundException("El veterinario seleccionado no existe."));
        Medicamento medicamento = medicamentoRepository.findById(rq.getMedicamentoId())
                .orElseThrow(() -> new ResourceNotFoundException("El medicamento seleccionado no existe."));

        if (!historia.getMascota().getMascotaId().equals(mascota.getMascotaId())) {
            throw new BusinessRuleException("La consulta seleccionada pertenece a otra mascota.");
        }
        validarFechaEmision(rq.getFechaEmision(), historia);

        FormulaMedica formula = new FormulaMedica();
        formula.setMascota(mascota);
        formula.setHistoria(historia);
        formula.setCita(historia.getCita());
        formula.setMedico(medico);
        formula.setMedicamento(medicamento);
        formula.setFechaEmision(rq.getFechaEmision().atStartOfDay());
        aplicarDatosClinicos(formula, rq);
        formula.setActiva(Boolean.TRUE);
        formula.setFechaCreacionRegistro(LocalDateTime.now());
        return aDetalle(formulaRepository.save(formula));
    }

    /**
     * {@inheritDoc}
     * <p>
     * Restricciones: una fórmula inactiva no se edita, y la mascota, la historia y el veterinario
     * no pueden cambiarse (alterarlos rompería la trazabilidad clínica). Sí se pueden corregir el
     * medicamento, la fecha de emisión, la dosis, la frecuencia, la duración y las indicaciones.
     * </p>
     */
    @Override
    @Transactional
    public FormulaDetalleRs actualizarFormula(Long id, FormulaRq rq) {
        FormulaMedica formula = buscar(id);
        if (Boolean.FALSE.equals(formula.getActiva())) {
            throw new BusinessRuleException("La fórmula está inactiva y no puede modificarse.");
        }
        ValidacionUtil.requerido(rq, "Debe enviar los datos de la fórmula.");
        ValidacionUtil.requerido(rq.getMedicamentoId(), "El medicamento es obligatorio.");
        ValidacionUtil.requerido(rq.getFechaEmision(), "La fecha de emisión es obligatoria.");

        boolean cambiaAsociacion =
                (rq.getMascotaId() != null && formula.getMascota() != null
                        && !rq.getMascotaId().equals(formula.getMascota().getMascotaId()))
                || (rq.getHistoriaId() != null && formula.getHistoria() != null
                        && !rq.getHistoriaId().equals(formula.getHistoria().getId()))
                || (rq.getMedicoId() != null && formula.getMedico() != null
                        && !rq.getMedicoId().equals(formula.getMedico().getId()));
        if (cambiaAsociacion) {
            throw new BusinessRuleException(
                    "No es posible cambiar la mascota, la historia ni el veterinario de una fórmula.");
        }
        if (formula.getHistoria() == null) {
            throw new BusinessRuleException(
                    "Esta fórmula es un registro antiguo sin historia clínica asociada y no puede editarse.");
        }

        Medicamento medicamento = medicamentoRepository.findById(rq.getMedicamentoId())
                .orElseThrow(() -> new ResourceNotFoundException("El medicamento seleccionado no existe."));
        validarFechaEmision(rq.getFechaEmision(), formula.getHistoria());

        formula.setMedicamento(medicamento);
        formula.setFechaEmision(rq.getFechaEmision().atStartOfDay());
        aplicarDatosClinicos(formula, rq);
        formula.setFechaActualizacionRegistro(LocalDateTime.now());
        return aDetalle(formulaRepository.save(formula));
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public FormulaDetalleRs inactivarFormula(Long id) {
        FormulaMedica formula = buscar(id);
        if (Boolean.FALSE.equals(formula.getActiva())) {
            throw new BusinessRuleException("La fórmula ya está inactiva.");
        }
        formula.setActiva(Boolean.FALSE);
        formula.setFechaActualizacionRegistro(LocalDateTime.now());
        return aDetalle(formulaRepository.save(formula));
    }

    /**
     * Busca una fórmula o lanza un error 404.
     *
     * @param id Identificador de la fórmula.
     * @return La fórmula encontrada.
     */
    private FormulaMedica buscar(Long id) {
        return formulaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La fórmula solicitada no existe."));
    }

    /**
     * Valida que la fecha de emisión no sea anterior a la fecha de la consulta.
     *
     * @param fechaEmision Fecha de emisión solicitada.
     * @param historia     Historia (consulta) asociada.
     */
    private void validarFechaEmision(LocalDate fechaEmision, HistoriaClinica historia) {
        if (fechaEmision.isBefore(historia.getFechaHora().toLocalDate())) {
            throw new BusinessRuleException("La fecha de emisión no puede ser anterior a la fecha de la consulta.");
        }
    }

    /**
     * Valida y copia a la fórmula los datos clínicos: dosis, frecuencia, duración e indicaciones.
     *
     * @param formula Fórmula a completar.
     * @param rq      Datos recibidos.
     */
    private void aplicarDatosClinicos(FormulaMedica formula, FormulaRq rq) {
        String dosis = ValidacionUtil.textoObligatorio(rq.getDosis(), "dosis", 255);
        Matcher matcher = PATRON_DOSIS.matcher(dosis);
        if (!matcher.matches()) {
            throw new BadRequestException(
                    "La dosis debe iniciar con un número seguido de la unidad (por ejemplo: 5 mg, 1 tableta, 2.5 ml).");
        }
        if (Double.parseDouble(matcher.group(1).replace(',', '.')) <= 0) {
            throw new BadRequestException("La dosis debe ser mayor que cero.");
        }
        ValidacionUtil.requerido(rq.getDuracionDias(), "La duración del tratamiento es obligatoria.");
        if (rq.getDuracionDias() < DURACION_MINIMA || rq.getDuracionDias() > DURACION_MAXIMA) {
            throw new BadRequestException("La duración del tratamiento debe estar entre " + DURACION_MINIMA
                    + " y " + DURACION_MAXIMA + " días.");
        }
        formula.setDosis(dosis);
        formula.setFrecuencia(ValidacionUtil.textoObligatorio(rq.getFrecuencia(), "frecuencia", 100));
        formula.setDuracionDias(rq.getDuracionDias());
        formula.setIndicaciones(ValidacionUtil.textoObligatorio(rq.getIndicaciones(), "indicaciones", 255));
    }

    /**
     * Arma un nombre completo, tolerando valores nulos (registros antiguos).
     *
     * @param nombres   Nombres.
     * @param apellidos Apellidos.
     * @return Nombre completo o {@code null} si no hay nombres.
     */
    private String nombreCompleto(String nombres, String apellidos) {
        if (nombres == null) {
            return null;
        }
        return apellidos == null ? nombres : nombres + " " + apellidos;
    }

    /**
     * Convierte la entidad en el resumen del listado, tolerando registros antiguos sin relaciones.
     *
     * @param f Entidad.
     * @return Resumen.
     */
    private FormulaRs aResumen(FormulaMedica f) {
        FormulaRs rs = new FormulaRs();
        rs.setId(f.getId());
        rs.setMascotaNombre(f.getMascota() == null ? null : f.getMascota().getNombreMascota());
        rs.setMedicoNombre(f.getMedico() == null ? null
                : nombreCompleto(f.getMedico().getNombres(), f.getMedico().getApellidos()));
        rs.setMedicamentoNombre(f.getMedicamento().getNombre());
        rs.setDosis(f.getDosis());
        rs.setFechaEmision(f.getFechaEmision() == null ? null : f.getFechaEmision().toLocalDate());
        rs.setFechaCreacion(f.getFechaCreacionRegistro());
        rs.setActiva(f.getActiva());
        return rs;
    }

    /**
     * Convierte la entidad en el detalle completo, tolerando registros antiguos sin relaciones.
     *
     * @param f Entidad.
     * @return Detalle.
     */
    private FormulaDetalleRs aDetalle(FormulaMedica f) {
        FormulaDetalleRs rs = new FormulaDetalleRs();
        rs.setId(f.getId());
        if (f.getMascota() != null) {
            rs.setMascotaId(f.getMascota().getMascotaId());
            rs.setMascotaNombre(f.getMascota().getNombreMascota());
            if (f.getMascota().getCliente() != null) {
                rs.setClienteNombre(nombreCompleto(f.getMascota().getCliente().getNombres(),
                        f.getMascota().getCliente().getApellidos()));
            }
        }
        if (f.getHistoria() != null) {
            rs.setHistoriaId(f.getHistoria().getId());
            rs.setFechaConsulta(f.getHistoria().getFechaHora());
        }
        rs.setCitaId(f.getCita().getId());
        if (f.getMedico() != null) {
            rs.setMedicoId(f.getMedico().getId());
            rs.setMedicoNombre(nombreCompleto(f.getMedico().getNombres(), f.getMedico().getApellidos()));
        }
        rs.setMedicamentoId(f.getMedicamento().getId());
        rs.setMedicamentoNombre(f.getMedicamento().getNombre());
        rs.setFechaEmision(f.getFechaEmision() == null ? null : f.getFechaEmision().toLocalDate());
        rs.setDosis(f.getDosis());
        rs.setFrecuencia(f.getFrecuencia());
        rs.setDuracionDias(f.getDuracionDias());
        rs.setIndicaciones(f.getIndicaciones());
        rs.setActiva(f.getActiva());
        rs.setFechaCreacion(f.getFechaCreacionRegistro());
        rs.setFechaActualizacion(f.getFechaActualizacionRegistro());
        return rs;
    }
}
