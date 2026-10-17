package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.EstadoFormula;
import com.uniminuto.clinica.entity.EstadoHistoria;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.FormulaFiltroRq;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.repository.FormulaRepository;
import com.uniminuto.clinica.repository.FormulaSpecification;
import com.uniminuto.clinica.repository.HistoriaClinicaRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.FormulaService;
import com.uniminuto.clinica.util.Paginacion;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Implementación de las reglas de negocio de las fórmulas médicas:
 * <ol>
 *     <li>La mascota debe existir.</li>
 *     <li>La mascota debe pertenecer a un cliente registrado y activo.</li>
 *     <li>El veterinario debe existir.</li>
 *     <li>La fecha de emisión no puede ser anterior a la consulta.</li>
 *     <li>Dosis, frecuencia y duración deben ser valores válidos.</li>
 *     <li>Los campos obligatorios se validan aquí aunque el frontend ya lo haga.</li>
 *     <li>La consulta (historia) debe ser de la misma mascota.</li>
 *     <li>No se eliminan: se inactivan, y una fórmula inactiva no se edita.</li>
 * </ol>
 */
@Service
public class FormulaServiceImpl implements FormulaService {

    /**
     * Dosis máxima por toma.
     */
    private static final BigDecimal DOSIS_MAXIMA = new BigDecimal("10000");

    /**
     * Horas mínimas y máximas entre tomas.
     */
    private static final int FRECUENCIA_MINIMA = 1;
    private static final int FRECUENCIA_MAXIMA = 168;

    /**
     * Días mínimos y máximos de tratamiento.
     */
    private static final int DURACION_MINIMA = 1;
    private static final int DURACION_MAXIMA = 365;

    /**
     * Longitud máxima de las indicaciones.
     */
    private static final int MAXIMO_INDICACIONES = 1000;

    /**
     * Unidades de dosis aceptadas (las mismas que ofrece el frontend).
     */
    private static final List<String> UNIDADES = List.of(
            "mg", "g", "ml", "gotas", "tableta", "cápsula", "UI", "aplicación");

    /**
     * Columnas ordenables y su campo real en la entidad.
     */
    private static final Map<String, String> CAMPOS_ORDEN = Map.of(
            "creacion", "fechaCreacion",
            "emision", "fechaEmision",
            "mascota", "historia.mascota.nombreMascota",
            "cliente", "historia.mascota.cliente.nombres",
            "medicamento", "medicamento.nombre",
            "medico", "medico.nombres",
            "estado", "estado");

    /**
     * Repositorio de fórmulas.
     */
    @Autowired
    private FormulaRepository formulaRepository;

    /**
     * Repositorio de historias clínicas.
     */
    @Autowired
    private HistoriaClinicaRepository historiaRepository;

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
     * Repositorio de medicamentos.
     */
    @Autowired
    private MedicamentoRepository medicamentoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<FormulaRs> listarFormulas(FormulaFiltroRq filtro) {
        Paginacion.validarRango(filtro.getDesde(), filtro.getHasta());
        EstadoFormula estado = Paginacion.convertirEnum(EstadoFormula.class, filtro.getEstado());
        return PaginaRs.desde(formulaRepository
                .findAll(FormulaSpecification.conFiltros(filtro, estado),
                        Paginacion.crear(filtro.getPage(), filtro.getSize(), filtro.getOrden(),
                                filtro.getDireccion(), CAMPOS_ORDEN, "fechaCreacion", "formulaId"))
                .map(this::convertirARespuesta));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public FormulaRs consultarFormula(Long formulaId) {
        return this.convertirARespuesta(this.buscar(formulaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarFormula(FormulaRq rq) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos de la fórmula");
        }
        if (rq.getMascotaId() == null) {
            throw new BadRequestException("Debe seleccionar la mascota");
        }
        if (rq.getHistoriaId() == null) {
            throw new BadRequestException("Debe seleccionar la consulta (historia clínica)");
        }
        if (rq.getMedicoId() == null) {
            throw new BadRequestException("Debe seleccionar el veterinario");
        }

        // Reglas 1 y 2: mascota existente, de un cliente registrado y activo.
        Mascota mascota = mascotaRepository.findById(rq.getMascotaId())
                .orElseThrow(() -> new NotFoundException("La mascota seleccionada no existe"));
        Cliente cliente = mascota.getCliente();
        if (cliente == null) {
            throw new ConflictException("La mascota no está asociada a un cliente registrado");
        }
        if (!Boolean.TRUE.equals(cliente.getActivo())) {
            throw new ConflictException("El dueño de la mascota está inactivo; actívelo antes de formular");
        }

        // Regla 7: la consulta debe ser de la misma mascota y estar abierta.
        HistoriaClinica historia = historiaRepository.findById(rq.getHistoriaId())
                .orElseThrow(() -> new NotFoundException("La historia clínica seleccionada no existe"));
        if (!historia.getMascota().getMascotaId().equals(mascota.getMascotaId())) {
            throw new BadRequestException("La consulta seleccionada pertenece a otra mascota");
        }
        if (historia.getEstado() == EstadoHistoria.CERRADA) {
            throw new ConflictException("La historia clínica está cerrada y no admite nuevas fórmulas");
        }

        // Regla 3: veterinario existente.
        Medico medico = medicoRepository.findById(rq.getMedicoId())
                .orElseThrow(() -> new NotFoundException("El veterinario seleccionado no existe"));

        FormulaMedica formula = new FormulaMedica();
        formula.setHistoria(historia);
        formula.setMedico(medico);
        this.aplicarTratamiento(formula, rq);
        formula.setEstado(EstadoFormula.ACTIVA);
        formula.setFechaCreacion(LocalDateTime.now());
        formulaRepository.save(formula);

        return MiRespuestaRS.de(201, "Fórmula médica registrada correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarFormula(Long formulaId, FormulaRq rq) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos de la fórmula");
        }
        FormulaMedica formula = this.buscar(formulaId);
        if (formula.getEstado() == EstadoFormula.INACTIVA) {
            throw new ConflictException("La fórmula está inactiva y no se puede modificar");
        }
        // Paciente, consulta y veterinario no cambian: solo los datos del tratamiento.
        this.aplicarTratamiento(formula, rq);
        formula.setFechaModificacion(LocalDateTime.now());
        formulaRepository.save(formula);
        return MiRespuestaRS.de(200, "Fórmula médica actualizada correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS inactivarFormula(Long formulaId) {
        FormulaMedica formula = this.buscar(formulaId);
        if (formula.getEstado() == EstadoFormula.INACTIVA) {
            throw new ConflictException("La fórmula ya está inactiva");
        }
        formula.setEstado(EstadoFormula.INACTIVA);
        formula.setFechaModificacion(LocalDateTime.now());
        formulaRepository.save(formula);
        return MiRespuestaRS.de(200, "Fórmula médica inactivada correctamente");
    }

    /**
     * Valida y copia a la fórmula los datos del tratamiento (reglas 4, 5 y 6).
     *
     * @param formula fórmula a completar; ya debe tener su historia.
     * @param rq      datos recibidos.
     */
    private void aplicarTratamiento(FormulaMedica formula, FormulaRq rq) {
        // Regla 4: la fecha de emisión no puede ser anterior a la consulta.
        LocalDate emision = rq.getFechaEmision();
        if (emision == null) {
            throw new BadRequestException("Debe indicar la fecha de emisión");
        }
        LocalDate fechaConsulta = formula.getHistoria().getFechaHora().toLocalDate();
        if (emision.isBefore(fechaConsulta)) {
            throw new BadRequestException("La fecha de emisión no puede ser anterior a la consulta ("
                    + fechaConsulta + ")");
        }

        if (rq.getMedicamentoId() == null) {
            throw new BadRequestException("Debe seleccionar el medicamento");
        }
        Medicamento medicamento = medicamentoRepository.findById(rq.getMedicamentoId())
                .orElseThrow(() -> new NotFoundException("El medicamento seleccionado no existe"));
        if (medicamento.getFechaVence() != null && medicamento.getFechaVence().isBefore(emision)) {
            throw new ConflictException("El medicamento " + medicamento.getNombre()
                    + " está vencido para la fecha de emisión");
        }

        // Regla 5: valores válidos de dosis, frecuencia y duración.
        BigDecimal dosis = rq.getDosis();
        if (dosis == null || dosis.signum() <= 0 || dosis.compareTo(DOSIS_MAXIMA) > 0) {
            throw new BadRequestException("La dosis debe ser mayor que 0 y no superar " + DOSIS_MAXIMA);
        }
        if (dosis.scale() > 2) {
            throw new BadRequestException("La dosis admite máximo dos decimales");
        }
        if (rq.getUnidadDosis() == null || !UNIDADES.contains(rq.getUnidadDosis().trim())) {
            throw new BadRequestException("La unidad de la dosis no es válida. Use: " + String.join(", ", UNIDADES));
        }
        this.validarRango(rq.getFrecuenciaHoras(), FRECUENCIA_MINIMA, FRECUENCIA_MAXIMA,
                "La frecuencia (horas entre tomas)");
        this.validarRango(rq.getDuracionDias(), DURACION_MINIMA, DURACION_MAXIMA,
                "La duración del tratamiento (días)");

        String indicaciones = Validaciones.obligatorio(rq.getIndicaciones(), "Las indicaciones", MAXIMO_INDICACIONES);

        formula.setFechaEmision(emision);
        formula.setMedicamento(medicamento);
        formula.setDosis(dosis);
        formula.setUnidadDosis(rq.getUnidadDosis().trim());
        formula.setFrecuenciaHoras(rq.getFrecuenciaHoras());
        formula.setDuracionDias(rq.getDuracionDias());
        formula.setIndicaciones(indicaciones);
    }

    /**
     * Valida que un entero obligatorio esté dentro de un rango.
     *
     * @param valor  valor recibido.
     * @param minimo mínimo permitido.
     * @param maximo máximo permitido.
     * @param nombre nombre del campo para el mensaje.
     */
    private void validarRango(Integer valor, int minimo, int maximo, String nombre) {
        if (valor == null || valor < minimo || valor > maximo) {
            throw new BadRequestException(nombre + " debe ser un entero entre " + minimo + " y " + maximo);
        }
    }

    /**
     * Busca una fórmula por su identificador.
     *
     * @param formulaId identificador.
     * @return la fórmula.
     */
    private FormulaMedica buscar(Long formulaId) {
        return formulaRepository.findById(formulaId)
                .orElseThrow(() -> new NotFoundException("La fórmula médica no existe"));
    }

    /**
     * Convierte una fórmula en la respuesta para el frontend.
     *
     * @param formula fórmula a convertir.
     * @return respuesta con los nombres de las entidades relacionadas.
     */
    private FormulaRs convertirARespuesta(FormulaMedica formula) {
        HistoriaClinica historia = formula.getHistoria();
        Mascota mascota = historia.getMascota();
        Cliente cliente = mascota.getCliente();
        Medico medico = formula.getMedico();
        Medicamento medicamento = formula.getMedicamento();

        FormulaRs rs = new FormulaRs();
        rs.setFormulaId(formula.getFormulaId());
        rs.setFechaEmision(formula.getFechaEmision());
        rs.setHistoriaId(historia.getHistoriaId());
        rs.setHistoriaFecha(historia.getFechaHora().toLocalDate());
        rs.setClienteId(cliente.getClienteId());
        rs.setClienteNombre(cliente.getNombres() + " " + cliente.getApellidos());
        rs.setMascotaId(mascota.getMascotaId());
        rs.setMascotaNombre(mascota.getNombreMascota());
        rs.setMedicoId(medico.getId());
        rs.setMedicoNombre(medico.getNombres() + " " + medico.getApellidos());
        rs.setMedicamentoId(medicamento.getId());
        rs.setMedicamentoNombre(medicamento.getNombre());
        rs.setDosis(formula.getDosis());
        rs.setUnidadDosis(formula.getUnidadDosis());
        rs.setFrecuenciaHoras(formula.getFrecuenciaHoras());
        rs.setDuracionDias(formula.getDuracionDias());
        rs.setIndicaciones(formula.getIndicaciones());
        rs.setEstado(formula.getEstado().name());
        rs.setFechaCreacion(formula.getFechaCreacion());
        rs.setFechaModificacion(formula.getFechaModificacion());
        return rs;
    }
}
