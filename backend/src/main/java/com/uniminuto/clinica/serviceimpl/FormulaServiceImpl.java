package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.EstadoDespacho;
import com.uniminuto.clinica.entity.EstadoEntrega;
import com.uniminuto.clinica.entity.EstadoFormula;
import com.uniminuto.clinica.entity.EstadoHistoria;
import com.uniminuto.clinica.entity.FormulaDetalle;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.FormulaDetalleRq;
import com.uniminuto.clinica.models.FormulaFiltroRq;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MotivoRq;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.repository.DespachoRepository;
import com.uniminuto.clinica.repository.FormulaRepository;
import com.uniminuto.clinica.repository.FormulaSpecification;
import com.uniminuto.clinica.repository.HistoriaClinicaRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.FormulaService;
import com.uniminuto.clinica.util.Paginacion;
import com.uniminuto.clinica.util.PdfDocumentos;
import com.uniminuto.clinica.util.UsuarioActual;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Implementación de la formulación médica. Reglas principales:
 * <ol>
 *     <li>Solo un veterinario enlazado a su usuario formula, y la fórmula queda a su nombre.</li>
 *     <li>La mascota debe existir y pertenecer a un cliente registrado y activo.</li>
 *     <li>La consulta (historia) debe ser de la misma mascota y estar abierta.</li>
 *     <li>La fecha de emisión no puede ser anterior a la consulta.</li>
 *     <li>Dosis, frecuencia, duración, cantidad y vía deben ser válidas, sin medicamentos repetidos.</li>
 *     <li>La fórmula se edita solo en borrador y solo por su autor; al confirmarla pasa a despacho.</li>
 *     <li>Formular no descuenta inventario: eso ocurre solo al confirmar la entrega en despacho.</li>
 *     <li>No se elimina: se anula, y solo si no tiene entregas.</li>
 * </ol>
 */
@Service
public class FormulaServiceImpl implements FormulaService {

    /**
     * Dosis máxima por toma.
     */
    private static final BigDecimal DOSIS_MAXIMA = new BigDecimal("10000");

    /**
     * Máximo de medicamentos por fórmula.
     */
    private static final int MAXIMO_LINEAS = 20;

    /**
     * Cantidad máxima de unidades por medicamento.
     */
    private static final int CANTIDAD_MAXIMA = 10000;

    /**
     * Unidades de dosis aceptadas (las mismas que ofrece el frontend).
     */
    private static final List<String> UNIDADES = List.of(
            "mg", "g", "ml", "gotas", "tableta", "cápsula", "UI", "aplicación");

    /**
     * Vías de administración aceptadas.
     */
    private static final List<String> VIAS = List.of(
            "ORAL", "TOPICA", "OFTALMICA", "OTICA", "SUBCUTANEA", "INTRAMUSCULAR", "INTRAVENOSA", "INHALADA", "RECTAL");

    /**
     * Columnas ordenables y su campo real en la entidad.
     */
    private static final Map<String, String> CAMPOS_ORDEN = Map.of(
            "creacion", "fechaCreacion",
            "numero", "formulaId",
            "emision", "fechaEmision",
            "mascota", "historia.mascota.nombreMascota",
            "cliente", "historia.mascota.cliente.nombres",
            "medico", "medico.nombres",
            "estado", "estado",
            "despacho", "estadoDespacho");

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
     * Repositorio de productos.
     */
    @Autowired
    private MedicamentoRepository medicamentoRepository;

    /**
     * Repositorio de entregas.
     */
    @Autowired
    private DespachoRepository despachoRepository;

    /**
     * Operaciones compartidas con despacho.
     */
    @Autowired
    private FormulaSoporte soporte;

    /**
     * Usuario autenticado.
     */
    @Autowired
    private UsuarioActual usuarioActual;

    /**
     * Generador de documentos PDF.
     */
    @Autowired
    private PdfDocumentos pdf;

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<FormulaRs> listarFormulas(FormulaFiltroRq filtro) {
        Paginacion.validarRango(filtro.getDesde(), filtro.getHasta());
        return PaginaRs.desde(formulaRepository
                .findAll(FormulaSpecification.conFiltros(filtro,
                                Paginacion.convertirEnum(EstadoFormula.class, filtro.getEstado()),
                                Paginacion.convertirEnum(EstadoDespacho.class, filtro.getEstadoDespacho())),
                        Paginacion.crear(filtro.getPage(), filtro.getSize(), filtro.getOrden(),
                                filtro.getDireccion(), CAMPOS_ORDEN, "fechaCreacion", "formulaId"))
                .map(soporte::resumen));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public FormulaRs consultarFormula(Long formulaId) {
        return soporte.detalle(soporte.buscar(formulaId));
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
        Usuario usuario = usuarioActual.obtener();
        Medico medico = this.medicoDelUsuario(usuario);
        if (rq.getMascotaId() == null) {
            throw new BadRequestException("Debe seleccionar la mascota");
        }
        if (rq.getHistoriaId() == null) {
            throw new BadRequestException("Debe seleccionar la consulta (historia clínica)");
        }

        // La mascota debe existir y pertenecer a un cliente registrado y activo.
        Mascota mascota = mascotaRepository.findById(rq.getMascotaId())
                .orElseThrow(() -> new NotFoundException("La mascota seleccionada no existe"));
        Cliente cliente = mascota.getCliente();
        if (cliente == null) {
            throw new ConflictException("La mascota no está asociada a un cliente registrado");
        }
        if (!Boolean.TRUE.equals(cliente.getActivo())) {
            throw new ConflictException("El dueño de la mascota está inactivo; actívelo antes de formular");
        }

        // La consulta debe ser de la misma mascota y estar abierta.
        HistoriaClinica historia = historiaRepository.findById(rq.getHistoriaId())
                .orElseThrow(() -> new NotFoundException("La historia clínica seleccionada no existe"));
        if (!historia.getMascota().getMascotaId().equals(mascota.getMascotaId())) {
            throw new BadRequestException("La consulta seleccionada pertenece a otra mascota");
        }
        if (historia.getEstado() == EstadoHistoria.CERRADA) {
            throw new ConflictException("La historia clínica está cerrada y no admite nuevas fórmulas");
        }

        FormulaMedica formula = new FormulaMedica();
        formula.setHistoria(historia);
        formula.setMedico(medico);
        this.aplicarDatos(formula, rq);
        formula.setEstado(EstadoFormula.BORRADOR);
        formula.setFechaCreacion(LocalDateTime.now());
        formulaRepository.save(formula);
        soporte.registrarEstado(formula, null, EstadoFormula.BORRADOR, usuario, "Fórmula creada");

        if (rq.isConfirmar()) {
            this.confirmar(formula, usuario);
            return MiRespuestaRS.de(201, "Fórmula médica N.° " + formula.getFormulaId()
                    + " registrada y enviada a despacho");
        }
        return MiRespuestaRS.de(201, "Fórmula médica N.° " + formula.getFormulaId() + " guardada como borrador");
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
        Usuario usuario = usuarioActual.obtener();
        FormulaMedica formula = soporte.buscarParaActualizar(formulaId);
        this.validarAutor(formula, usuario);
        if (formula.getEstado() != EstadoFormula.BORRADOR) {
            throw new ConflictException("Solo se puede modificar una fórmula en borrador; esta ya está "
                    + formula.getEstado().name().toLowerCase());
        }
        this.aplicarDatos(formula, rq);
        formula.setFechaModificacion(LocalDateTime.now());
        formulaRepository.save(formula);

        if (rq.isConfirmar()) {
            this.confirmar(formula, usuario);
            return MiRespuestaRS.de(200, "Fórmula médica actualizada y enviada a despacho");
        }
        return MiRespuestaRS.de(200, "Fórmula médica actualizada");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS confirmarFormula(Long formulaId) {
        Usuario usuario = usuarioActual.obtener();
        FormulaMedica formula = soporte.buscarParaActualizar(formulaId);
        this.validarAutor(formula, usuario);
        if (formula.getEstado() != EstadoFormula.BORRADOR) {
            throw new ConflictException("La fórmula ya está " + formula.getEstado().name().toLowerCase());
        }
        this.confirmar(formula, usuario);
        return MiRespuestaRS.de(200, "Fórmula médica confirmada y enviada a despacho");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS anularFormula(Long formulaId, MotivoRq rq) {
        String motivo = Validaciones.obligatorio(rq == null ? null : rq.getMotivo(), "El motivo de la anulación", 255);
        Usuario usuario = usuarioActual.obtener();
        FormulaMedica formula = soporte.buscarParaActualizar(formulaId);
        this.validarAutor(formula, usuario);
        if (formula.getEstado() == EstadoFormula.ANULADA) {
            throw new ConflictException("La fórmula ya está anulada");
        }
        if (despachoRepository.existsByFormula_FormulaIdAndEstado(formulaId, EstadoEntrega.CONFIRMADO)) {
            throw new ConflictException("La fórmula tiene medicamentos entregados; despacho debe revertir "
                    + "las entregas antes de anularla");
        }
        EstadoFormula anterior = formula.getEstado();
        formula.setEstado(EstadoFormula.ANULADA);
        if (formula.getEstadoDespacho() != null) {
            formula.setEstadoDespacho(EstadoDespacho.CANCELADO);
        }
        formula.setFechaModificacion(LocalDateTime.now());
        formulaRepository.save(formula);
        soporte.registrarEstado(formula, anterior, EstadoFormula.ANULADA, usuario, motivo);
        return MiRespuestaRS.de(200, "Fórmula médica anulada");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public byte[] generarPdf(Long formulaId) {
        FormulaMedica formula = soporte.buscar(formulaId);
        if (formula.getEstado() == EstadoFormula.ANULADA) {
            throw new ConflictException("La fórmula está anulada y no se puede imprimir");
        }
        return pdf.formula(soporte.detalle(formula));
    }

    /**
     * Confirma la fórmula: deja de ser editable y queda pendiente de despacho.
     *
     * @param formula fórmula en borrador.
     * @param usuario usuario responsable.
     */
    private void confirmar(FormulaMedica formula, Usuario usuario) {
        formula.setEstado(EstadoFormula.CONFIRMADA);
        formula.setEstadoDespacho(EstadoDespacho.PENDIENTE_DESPACHO);
        formula.setFechaConfirmacion(LocalDateTime.now());
        formulaRepository.save(formula);
        soporte.registrarEstado(formula, EstadoFormula.BORRADOR, EstadoFormula.CONFIRMADA, usuario,
                "Confirmada por el veterinario; queda pendiente de despacho");
    }

    /**
     * Obtiene el veterinario enlazado al usuario autenticado.
     *
     * @param usuario usuario autenticado.
     * @return el veterinario.
     */
    private Medico medicoDelUsuario(Usuario usuario) {
        return medicoRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new ConflictException(
                        "Su usuario no está enlazado a un veterinario; pida al administrador que lo enlace"));
    }

    /**
     * Valida que el usuario sea el veterinario que creó la fórmula.
     *
     * @param formula fórmula.
     * @param usuario usuario autenticado.
     */
    private void validarAutor(FormulaMedica formula, Usuario usuario) {
        if (!formula.getMedico().getId().equals(this.medicoDelUsuario(usuario).getId())) {
            throw new ConflictException("Solo el veterinario que emitió la fórmula puede modificarla");
        }
    }

    /**
     * Valida y copia la fecha, las observaciones y las líneas. Las líneas se
     * actualizan por medicamento (se modifican, agregan o retiran), para no
     * violar la unicidad de medicamento por fórmula al guardar.
     *
     * @param formula fórmula a completar (ya con su historia).
     * @param rq      datos recibidos.
     */
    private void aplicarDatos(FormulaMedica formula, FormulaRq rq) {
        if (rq.getFechaEmision() == null) {
            throw new BadRequestException("Debe indicar la fecha de emisión");
        }
        LocalDate fechaConsulta = formula.getHistoria().getFechaHora().toLocalDate();
        if (rq.getFechaEmision().isBefore(fechaConsulta)) {
            throw new BadRequestException("La fecha de emisión no puede ser anterior a la consulta ("
                    + fechaConsulta + ")");
        }
        List<FormulaDetalleRq> lineas = rq.getDetalles();
        if (lineas == null || lineas.isEmpty()) {
            throw new BadRequestException("Debe formular al menos un medicamento");
        }
        if (lineas.size() > MAXIMO_LINEAS) {
            throw new BadRequestException("Una fórmula admite máximo " + MAXIMO_LINEAS + " medicamentos");
        }
        Set<Long> vistos = new HashSet<>();
        for (FormulaDetalleRq linea : lineas) {
            if (linea == null || linea.getMedicamentoId() == null) {
                throw new BadRequestException("Debe seleccionar el medicamento de cada línea");
            }
            if (!vistos.add(linea.getMedicamentoId())) {
                throw new BadRequestException("Un medicamento no puede repetirse en la misma fórmula");
            }
        }
        Map<Long, Medicamento> productos = medicamentoRepository.findAllById(vistos).stream()
                .collect(Collectors.toMap(Medicamento::getId, Function.identity()));
        if (productos.size() != vistos.size()) {
            throw new NotFoundException("Alguno de los medicamentos seleccionados no existe");
        }

        Map<Long, FormulaDetalle> actuales = formula.getDetalles().stream()
                .collect(Collectors.toMap(d -> d.getMedicamento().getId(), Function.identity()));
        for (FormulaDetalleRq linea : lineas) {
            Medicamento medicamento = productos.get(linea.getMedicamentoId());
            FormulaDetalle detalle = actuales.get(medicamento.getId());
            if (detalle == null && !Boolean.TRUE.equals(medicamento.getActivo())) {
                throw new ConflictException("El producto " + medicamento.getNombre() + " está inactivo");
            }
            if (detalle == null) {
                detalle = new FormulaDetalle();
                detalle.setFormula(formula);
                detalle.setMedicamento(medicamento);
                formula.getDetalles().add(detalle);
            }
            this.aplicarLinea(detalle, linea, medicamento.getNombre());
        }
        formula.getDetalles().removeIf(d -> !vistos.contains(d.getMedicamento().getId()));

        formula.setFechaEmision(rq.getFechaEmision());
        formula.setObservaciones(Validaciones.opcional(rq.getObservaciones(), "Las observaciones", 1000));
    }

    /**
     * Valida y copia los datos de una línea.
     *
     * @param detalle línea a completar.
     * @param rq      datos recibidos.
     * @param nombre  nombre del medicamento, para los mensajes.
     */
    private void aplicarLinea(FormulaDetalle detalle, FormulaDetalleRq rq, String nombre) {
        String prefijo = nombre + ": ";
        BigDecimal dosis = rq.getDosis();
        if (dosis == null || dosis.signum() <= 0 || dosis.compareTo(DOSIS_MAXIMA) > 0 || dosis.scale() > 2) {
            throw new BadRequestException(prefijo + "la dosis debe ser mayor que 0, no superar "
                    + DOSIS_MAXIMA + " y tener máximo dos decimales");
        }
        if (rq.getUnidadDosis() == null || !UNIDADES.contains(rq.getUnidadDosis().trim())) {
            throw new BadRequestException(prefijo + "la unidad de la dosis no es válida. Use: " + String.join(", ", UNIDADES));
        }
        this.validarRango(rq.getFrecuenciaHoras(), 1, 168, prefijo + "la frecuencia (horas entre tomas)");
        this.validarRango(rq.getDuracionDias(), 1, 365, prefijo + "la duración del tratamiento (días)");
        this.validarRango(rq.getCantidadPrescrita(), 1, CANTIDAD_MAXIMA, prefijo + "la cantidad prescrita");
        String via = rq.getViaAdministracion() == null ? null : rq.getViaAdministracion().trim().toUpperCase();
        if (via == null || !VIAS.contains(via)) {
            throw new BadRequestException(prefijo + "la vía de administración no es válida. Use: " + String.join(", ", VIAS));
        }
        detalle.setDosis(dosis);
        detalle.setUnidadDosis(rq.getUnidadDosis().trim());
        detalle.setFrecuenciaHoras(rq.getFrecuenciaHoras());
        detalle.setDuracionDias(rq.getDuracionDias());
        detalle.setCantidadPrescrita(rq.getCantidadPrescrita());
        detalle.setViaAdministracion(via);
        if (rq.getIndicaciones() == null || rq.getIndicaciones().isBlank()) {
            throw new BadRequestException(prefijo + "debe indicar las indicaciones especiales");
        }
        if (rq.getIndicaciones().trim().length() > 1000) {
            throw new BadRequestException(prefijo + "las indicaciones no pueden superar los 1000 caracteres");
        }
        detalle.setIndicaciones(rq.getIndicaciones().trim());
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
}
