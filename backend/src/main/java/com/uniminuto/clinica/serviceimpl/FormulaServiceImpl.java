package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.FormulaEstadoHistorial;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.FormulaMedicaDetalle;
import com.uniminuto.clinica.entity.LoteMedicamento;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.ForbiddenException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.FormulaEstadoHistorialRepository;
import com.uniminuto.clinica.repository.FormulaMedicaRepository;
import com.uniminuto.clinica.repository.HistoriaMedicaRepository;
import com.uniminuto.clinica.repository.LoteMedicamentoRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.security.ContextoUsuario;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.security.UsuarioActual;
import com.uniminuto.clinica.service.AuthService;
import com.uniminuto.clinica.service.FormulaService;
import com.uniminuto.clinica.utils.Constantes;
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Formulación médica. Crear o confirmar una fórmula NO descuenta inventario:
 * sólo consulta la disponibilidad. El descuento ocurre en el módulo de despacho.
 */
@Service
public class FormulaServiceImpl implements FormulaService {

    @Autowired
    private FormulaMedicaRepository formulaRepository;

    @Autowired
    private FormulaEstadoHistorialRepository historialRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private HistoriaMedicaRepository historiaRepository;

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    @Autowired
    private LoteMedicamentoRepository loteRepository;

    @Autowired
    private FormulaTrazabilidad trazabilidad;

    @Autowired
    private AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public List<FormulaMedica> listar() {
        UsuarioActual u = ContextoUsuario.obtener();
        return Roles.MEDICO.equals(u.perfilCodigo())
                ? formulaRepository.findByMedico_IdOrderByFechaCreacionRegistroDesc(u.medicoId())
                : formulaRepository.findAllByOrderByFechaCreacionRegistroDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public FormulaMedica consultar(Long formulaId) {
        Validar.idValido(formulaId, "formulaId");
        FormulaMedica f = formulaRepository.findById(formulaId)
                .orElseThrow(() -> new NotFoundException("La fórmula médica no existe."));
        UsuarioActual u = ContextoUsuario.obtener();
        if (Roles.MEDICO.equals(u.perfilCodigo()) && !f.getMedico().getId().equals(u.medicoId())) {
            throw new ForbiddenException("La fórmula fue emitida por otro veterinario.");
        }
        f.getDetalles().size();
        return f;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FormulaMedica> porCita(Long citaId) {
        Validar.idValido(citaId, "citaId");
        return formulaRepository.findByCita_IdOrderByIdAsc(citaId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FormulaEstadoHistorial> historial(Long formulaId) {
        consultar(formulaId);
        return historialRepository.findByFormulaIdOrderByFechaAscIdAsc(formulaId);
    }

    @Override
    @Transactional
    public MiRespuestaRS guardar(FormulaRq rq) {
        validarEncabezado(rq);
        Cita cita = citaEnAtencion(rq.getCitaId());
        FormulaMedica f = new FormulaMedica();
        f.setCita(cita);
        f.setMascota(cita.getMascota());
        f.setMedico(cita.getMedico());
        f.setHistoriaId(historiaRepository.findByCita_Id(cita.getId()).map(h -> h.getId()).orElse(null));
        f.setFechaEmision(LocalDate.now());
        f.setEstado(Constantes.FORMULA_BORRADOR);
        f.setEstadoDespacho(Constantes.DESP_NO_APLICA);
        f.setIndicaciones(Validar.textoOpcional(rq.getIndicaciones(), "indicaciones generales", 4000));
        f.setUsuarioId(ContextoUsuario.obtener().usuarioId());
        f.setActivo(Boolean.TRUE);
        f.setFechaCreacionRegistro(LocalDateTime.now());
        List<String> advertencias = new ArrayList<>();
        for (FormulaMedicaDetalle d : construirDetalles(rq, advertencias)) {
            d.setFormula(f);
            f.getDetalles().add(d);
        }
        formulaRepository.save(f);
        trazabilidad.registrar(f, null, Constantes.FORMULA_BORRADOR, "Fórmula creada", authService.usuarioActual());
        return MiRespuestaRS.creado(mensaje("Fórmula guardada en borrador.", advertencias), f.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS actualizar(FormulaRq rq) {
        validarEncabezado(rq);
        Validar.idValido(rq.getId(), "id");
        FormulaMedica f = formulaPropia(rq.getId());
        if (!Constantes.FORMULA_BORRADOR.equals(f.getEstado())) {
            throw new ConflictException("Sólo se pueden editar fórmulas en borrador.");
        }
        if (!f.getCita().getId().equals(rq.getCitaId())) {
            throw new ConflictException("La consulta asociada a la fórmula no se puede cambiar.");
        }
        citaEnAtencion(rq.getCitaId());
        List<String> advertencias = new ArrayList<>();
        List<FormulaMedicaDetalle> nuevos = construirDetalles(rq, advertencias);
        f.getDetalles().clear();
        formulaRepository.saveAndFlush(f);
        for (FormulaMedicaDetalle d : nuevos) {
            d.setFormula(f);
            f.getDetalles().add(d);
        }
        f.setIndicaciones(Validar.textoOpcional(rq.getIndicaciones(), "indicaciones generales", 4000));
        f.setFechaActualizacionRegistro(LocalDateTime.now());
        formulaRepository.save(f);
        return MiRespuestaRS.ok(mensaje("Fórmula actualizada.", advertencias), f.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS confirmar(Long formulaId) {
        FormulaMedica f = formulaPropia(formulaId);
        if (!Constantes.FORMULA_BORRADOR.equals(f.getEstado())) {
            throw new ConflictException("La fórmula ya fue " + f.getEstado().toLowerCase() + ".");
        }
        citaEnAtencion(f.getCita().getId());
        if (f.getDetalles().isEmpty()) {
            throw new ConflictException("La fórmula no tiene medicamentos.");
        }
        List<String> advertencias = new ArrayList<>();
        for (FormulaMedicaDetalle d : f.getDetalles()) {
            if (!Boolean.TRUE.equals(d.getMedicamento().getActivo())) {
                throw new ConflictException(d.getMedicamento().getNombre() + " está inactivo; retírelo de la fórmula.");
            }
            int vigente = stockVigente(d.getMedicamento().getId());
            if (vigente < d.getCantidadPrescrita()) {
                advertencias.add(d.getMedicamento().getNombre() + ": disponible " + vigente + " de " + d.getCantidadPrescrita());
            }
        }
        f.setEstado(Constantes.FORMULA_CONFIRMADA);
        f.setEstadoDespacho(Constantes.DESP_PENDIENTE);
        f.setNumero(String.format("FM-%06d", f.getId()));
        f.setFechaConfirmacion(LocalDateTime.now());
        f.setFechaActualizacionRegistro(LocalDateTime.now());
        formulaRepository.save(f);
        trazabilidad.registrar(f, Constantes.FORMULA_BORRADOR, Constantes.DESP_PENDIENTE,
                "Fórmula confirmada por el veterinario", authService.usuarioActual());
        return MiRespuestaRS.ok(mensaje("Fórmula " + f.getNumero() + " confirmada y enviada a despacho.", advertencias), f.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS anular(Long formulaId, String motivo) {
        String m = Validar.texto(motivo, "motivo de anulación", 500);
        FormulaMedica f = formulaPropia(formulaId);
        if (Constantes.FORMULA_ANULADA.equals(f.getEstado())) {
            throw new ConflictException("La fórmula ya está anulada.");
        }
        boolean conDespacho = f.getDetalles().stream().anyMatch(d -> d.getCantidadDespachada() > 0);
        if (conDespacho) {
            throw new ConflictException("La fórmula ya tiene medicamentos dispensados; el despacho debe revertirse primero.");
        }
        String anterior = Constantes.FORMULA_BORRADOR.equals(f.getEstado()) ? f.getEstado() : f.getEstadoDespacho();
        f.setEstado(Constantes.FORMULA_ANULADA);
        f.setEstadoDespacho(Constantes.FORMULA_BORRADOR.equals(anterior) ? Constantes.DESP_NO_APLICA : Constantes.DESP_CANCELADO);
        f.setActivo(Boolean.FALSE);
        f.setFechaActualizacionRegistro(LocalDateTime.now());
        formulaRepository.save(f);
        trazabilidad.registrar(f, anterior, Constantes.FORMULA_ANULADA, m, authService.usuarioActual());
        return MiRespuestaRS.ok("Fórmula anulada.", f.getId());
    }

    // ------------------------------------------------------------------ apoyo

    /** Cantidad = dosis por toma x número de tomas (redondeado hacia arriba). */
    static int calcularCantidad(BigDecimal dosisCantidad, int frecuenciaHoras, int duracionDias) {
        int tomas = (int) Math.ceil((duracionDias * 24.0) / frecuenciaHoras);
        return dosisCantidad.multiply(BigDecimal.valueOf(tomas)).setScale(0, RoundingMode.CEILING).intValueExact();
    }

    private List<FormulaMedicaDetalle> construirDetalles(FormulaRq rq, List<String> advertencias) {
        if (rq.getDetalles() == null || rq.getDetalles().isEmpty()) {
            throw new BadRequestException("Seleccione al menos un medicamento.");
        }
        Set<Long> vistos = new HashSet<>();
        List<FormulaMedicaDetalle> lista = new ArrayList<>();
        for (FormulaRq.Detalle d : rq.getDetalles()) {
            Validar.idValido(d.getMedicamentoId(), "medicamento");
            if (!vistos.add(d.getMedicamentoId())) {
                throw new BadRequestException("Un medicamento está repetido en la fórmula.");
            }
            Medicamento med = medicamentoRepository.findById(d.getMedicamentoId())
                    .orElseThrow(() -> new NotFoundException("El medicamento " + d.getMedicamentoId() + " no existe."));
            if (!Boolean.TRUE.equals(med.getActivo())) {
                throw new ConflictException(med.getNombre() + " está inactivo y no se puede formular.");
            }
            Validar.obligatorio(d.getDosisCantidad(), "cantidad por dosis de " + med.getNombre());
            if (d.getDosisCantidad().signum() <= 0 || d.getDosisCantidad().compareTo(BigDecimal.valueOf(1000)) > 0) {
                throw new BadRequestException("La cantidad por dosis de " + med.getNombre() + " debe ser mayor a 0.");
            }
            int frecuencia = Validar.entero(d.getFrecuenciaHoras(), "frecuencia (horas) de " + med.getNombre(), 1, 168);
            int duracion = Validar.entero(d.getDuracionDias(), "duración (días) de " + med.getNombre(), 1, 365);
            int calculada = calcularCantidad(d.getDosisCantidad(), frecuencia, duracion);
            int cantidad = d.getCantidadPrescrita() == null ? calculada
                    : Validar.entero(d.getCantidadPrescrita(), "cantidad prescrita de " + med.getNombre(), 1, 100_000);
            FormulaMedicaDetalle det = new FormulaMedicaDetalle();
            det.setMedicamento(med);
            det.setDosis(Validar.texto(d.getDosis(), "dosis de " + med.getNombre(), 100));
            det.setDosisCantidad(d.getDosisCantidad().setScale(2, RoundingMode.HALF_UP));
            det.setFrecuenciaHoras(frecuencia);
            det.setDuracionDias(duracion);
            det.setCantidadPrescrita(cantidad);
            det.setCantidadDespachada(0);
            det.setViaAdministracion(Validar.enLista(d.getViaAdministracion(), Constantes.VIAS_ADMINISTRACION, "vía de administración"));
            det.setIndicaciones(Validar.textoOpcional(d.getIndicaciones(), "indicaciones especiales", 2000));
            int vigente = stockVigente(med.getId());
            if (vigente < cantidad) {
                advertencias.add(med.getNombre() + ": disponible " + vigente + " de " + cantidad + " (quedará pendiente por disponibilidad)");
            }
            lista.add(det);
        }
        return lista;
    }

    private int stockVigente(Long medicamentoId) {
        LocalDate hoy = LocalDate.now();
        return loteRepository.conExistenciaFefo(medicamentoId).stream()
                .filter(l -> !l.estaVencido(hoy)).mapToInt(LoteMedicamento::getCantidadDisponible).sum();
    }

    private Cita citaEnAtencion(Long citaId) {
        Validar.idValido(citaId, "citaId");
        Cita c = citaRepository.findById(citaId).orElseThrow(() -> new NotFoundException("La cita no existe."));
        UsuarioActual u = ContextoUsuario.obtener();
        if (!c.getMedico().getId().equals(u.medicoId())) {
            throw new ForbiddenException("Sólo el veterinario de la cita puede formular.");
        }
        if (!Constantes.CITA_EN_ATENCION.equals(c.getEstado())) {
            throw new ConflictException("Las fórmulas se registran durante la atención (la cita está " + c.getEstado() + ").");
        }
        return c;
    }

    private FormulaMedica formulaPropia(Long formulaId) {
        Validar.idValido(formulaId, "formulaId");
        FormulaMedica f = formulaRepository.findById(formulaId)
                .orElseThrow(() -> new NotFoundException("La fórmula médica no existe."));
        if (!f.getMedico().getId().equals(ContextoUsuario.obtener().medicoId())) {
            throw new ForbiddenException("Sólo el veterinario que emitió la fórmula puede modificarla.");
        }
        return f;
    }

    private void validarEncabezado(FormulaRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información de la fórmula es obligatoria.");
        }
        Validar.idValido(rq.getCitaId(), "citaId");
    }

    private static String mensaje(String base, List<String> advertencias) {
        return advertencias.isEmpty() ? base : base + " Advertencia de inventario: " + String.join("; ", advertencias) + ".";
    }
}
