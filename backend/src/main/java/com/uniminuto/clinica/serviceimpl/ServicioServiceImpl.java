package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.entity.Servicio;
import com.uniminuto.clinica.entity.ServicioTarifaLog;
import com.uniminuto.clinica.entity.TipoServicio;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.ServicioRq;
import com.uniminuto.clinica.models.ServicioRs;
import com.uniminuto.clinica.models.TarifaLogRs;
import com.uniminuto.clinica.repository.EspecializacionRepository;
import com.uniminuto.clinica.repository.ServicioRepository;
import com.uniminuto.clinica.repository.ServicioTarifaLogRepository;
import com.uniminuto.clinica.service.ServicioService;
import com.uniminuto.clinica.util.Dinero;
import com.uniminuto.clinica.util.Paginacion;
import com.uniminuto.clinica.util.UsuarioActual;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Servicios y tarifas. Reglas:
 * <ul>
 *     <li>Código y nombre únicos; valor no negativo e IVA entre 0 y 100 %.</li>
 *     <li>Cada consulta pertenece a una especialidad activa y solo puede haber una consulta
 *         activa por especialidad (es la que se cobra al atender).</li>
 *     <li>Todo cambio de valor, IVA o estado queda en el log con usuario, fecha y motivo.</li>
 *     <li>Las facturas guardan el valor vigente al facturar, así que cambiar una tarifa no
 *         altera facturas anteriores.</li>
 * </ul>
 */
@Service
public class ServicioServiceImpl implements ServicioService {

    /** Formato del código. */
    private static final Pattern CODIGO = Pattern.compile("^[A-Z0-9-]{3,20}$");

    /** Identificador inexistente, para validar duplicados al crear. */
    private static final Long SIN_ID = -1L;

    /** Repositorio de servicios. */
    @Autowired
    private ServicioRepository servicioRepository;

    /** Repositorio del log de tarifas. */
    @Autowired
    private ServicioTarifaLogRepository logRepository;

    /** Repositorio de especialidades. */
    @Autowired
    private EspecializacionRepository especializacionRepository;

    /** Usuario autenticado. */
    @Autowired
    private UsuarioActual usuarioActual;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<ServicioRs> listar(boolean soloActivos) {
        return servicioRepository.findAllByOrderByTipoAscNombreAsc().stream()
                .filter(s -> !soloActivos || Boolean.TRUE.equals(s.getActivo()))
                .map(ServicioServiceImpl::convertir).toList();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ServicioRs consultar(Long id) {
        return convertir(this.buscar(id));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardar(ServicioRq rq) {
        Servicio servicio = new Servicio();
        this.aplicar(servicio, rq, SIN_ID);
        servicio.setActivo(Boolean.TRUE);
        servicio.setFechaCreacion(LocalDateTime.now());
        servicioRepository.save(servicio);
        this.registrar(servicio, "CREADO", null, null, Validaciones.opcional(rq.getObservacion(), "La observación", 255));
        return MiRespuestaRS.de(201, "Servicio " + servicio.getCodigo() + " registrado");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizar(Long id, ServicioRq rq) {
        Servicio servicio = this.buscar(id);
        BigDecimal valorAnterior = servicio.getValor();
        BigDecimal ivaAnterior = servicio.getIvaPorcentaje();
        this.aplicar(servicio, rq, id);
        boolean cambioTarifa = valorAnterior.compareTo(servicio.getValor()) != 0
                || ivaAnterior.compareTo(servicio.getIvaPorcentaje()) != 0;
        String observacion = Validaciones.opcional(rq.getObservacion(), "El motivo del cambio", 255);
        if (cambioTarifa && observacion == null) {
            throw new BadRequestException("Indique el motivo del cambio de tarifa; queda en el historial");
        }
        servicio.setFechaModificacion(LocalDateTime.now());
        servicioRepository.save(servicio);
        this.registrar(servicio, "MODIFICADO", valorAnterior, ivaAnterior, observacion);
        return MiRespuestaRS.de(200, cambioTarifa
                ? "Tarifa actualizada; las facturas anteriores conservan su valor"
                : "Servicio actualizado");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS cambiarActivo(Long id, boolean activo) {
        Servicio servicio = this.buscar(id);
        if (Boolean.valueOf(activo).equals(servicio.getActivo())) {
            return MiRespuestaRS.de(200, activo ? "El servicio ya está activo" : "El servicio ya está inactivo");
        }
        if (activo && servicio.getTipo() == TipoServicio.CONSULTA && servicio.getEspecializacion() != null
                && servicioRepository.existsByTipoAndEspecializacion_IdAndActivoTrueAndServicioIdNot(
                TipoServicio.CONSULTA, servicio.getEspecializacion().getId(), id)) {
            throw new ConflictException("Ya hay otra consulta activa para " + servicio.getEspecializacion().getNombre()
                    + "; inactívela primero");
        }
        servicio.setActivo(activo);
        servicio.setFechaModificacion(LocalDateTime.now());
        servicioRepository.save(servicio);
        this.registrar(servicio, activo ? "ACTIVADO" : "INACTIVADO", servicio.getValor(), servicio.getIvaPorcentaje(), null);
        return MiRespuestaRS.de(200, activo ? "Servicio activado" : "Servicio inactivado");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<TarifaLogRs> historial(Long id) {
        this.buscar(id);
        return logRepository.findByServicio_ServicioIdOrderByFechaDescLogIdDesc(id).stream().map(l -> {
            TarifaLogRs rs = new TarifaLogRs();
            rs.setFecha(l.getFecha());
            rs.setUsuario(l.getUsuario() == null ? "Sistema" : l.getUsuario().getUsername());
            rs.setAccion(l.getAccion());
            rs.setValorAnterior(l.getValorAnterior());
            rs.setValorNuevo(l.getValorNuevo());
            rs.setIvaAnterior(l.getIvaAnterior());
            rs.setIvaNuevo(l.getIvaNuevo());
            rs.setObservacion(l.getObservacion());
            return rs;
        }).toList();
    }

    /**
     * Valida y aplica los datos al servicio (sin guardarlo).
     */
    private void aplicar(Servicio servicio, ServicioRq rq, Long id) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos del servicio");
        }
        String codigo = Validaciones.conPatron(rq.getCodigo() == null ? null : rq.getCodigo().trim().toUpperCase(),
                "El código", 20, CODIGO, "El código debe tener de 3 a 20 letras, números o guiones");
        String nombre = Validaciones.obligatorio(rq.getNombre(), "El nombre", 150);
        TipoServicio tipo = Paginacion.convertirEnum(TipoServicio.class, rq.getTipo());
        if (tipo == null) {
            throw new BadRequestException("Indique el tipo: CONSULTA, PROCEDIMIENTO, LABORATORIO u OTRO");
        }
        Especializacion especializacion = null;
        if (rq.getEspecializacionId() != null) {
            especializacion = especializacionRepository.findById(rq.getEspecializacionId())
                    .orElseThrow(() -> new NotFoundException("La especialidad no existe"));
            boolean cambiaEspecialidad = servicio.getEspecializacion() == null
                    || !servicio.getEspecializacion().getId().equals(especializacion.getId());
            if (cambiaEspecialidad && !Boolean.TRUE.equals(especializacion.getActivo())) {
                throw new ConflictException("La especialidad " + especializacion.getNombre() + " está inactiva");
            }
        }
        if (tipo == TipoServicio.CONSULTA && especializacion == null) {
            throw new BadRequestException("Una consulta debe indicar su especialidad");
        }
        boolean activo = id.equals(SIN_ID) || Boolean.TRUE.equals(servicio.getActivo());
        if (tipo == TipoServicio.CONSULTA && activo && servicioRepository
                .existsByTipoAndEspecializacion_IdAndActivoTrueAndServicioIdNot(tipo, especializacion.getId(), id)) {
            throw new ConflictException("Ya existe una consulta activa para " + especializacion.getNombre()
                    + "; modifique su valor en lugar de crear otra");
        }
        if (servicioRepository.existsByCodigoIgnoreCaseAndServicioIdNot(codigo, id)) {
            throw new ConflictException("Ya existe un servicio con el código " + codigo);
        }
        if (servicioRepository.existsByNombreIgnoreCaseAndServicioIdNot(nombre, id)) {
            throw new ConflictException("Ya existe un servicio con el nombre " + nombre);
        }
        servicio.setCodigo(codigo);
        servicio.setNombre(nombre);
        servicio.setDescripcion(Validaciones.opcional(rq.getDescripcion(), "La descripción", 500));
        servicio.setTipo(tipo);
        servicio.setEspecializacion(especializacion);
        servicio.setValor(Dinero.validar(rq.getValor(), "El valor", false));
        servicio.setIvaPorcentaje(Dinero.validarPorcentaje(rq.getIvaPorcentaje(), "El IVA"));
    }

    /**
     * Registra un cambio en el log de tarifas.
     */
    private void registrar(Servicio servicio, String accion, BigDecimal valorAnterior, BigDecimal ivaAnterior,
                           String observacion) {
        ServicioTarifaLog log = new ServicioTarifaLog();
        log.setServicio(servicio);
        log.setFecha(LocalDateTime.now());
        log.setUsuario(usuarioActual.obtener());
        log.setAccion(accion);
        log.setValorAnterior(valorAnterior);
        log.setValorNuevo(servicio.getValor());
        log.setIvaAnterior(ivaAnterior);
        log.setIvaNuevo(servicio.getIvaPorcentaje());
        log.setObservacion(observacion);
        logRepository.save(log);
    }

    /**
     * Busca un servicio o responde 404.
     */
    private Servicio buscar(Long id) {
        return servicioRepository.findById(id).orElseThrow(() -> new NotFoundException("El servicio no existe"));
    }

    /**
     * Convierte un servicio en respuesta, con el IVA y el total calculados.
     *
     * @param s servicio.
     * @return respuesta.
     */
    static ServicioRs convertir(Servicio s) {
        ServicioRs rs = new ServicioRs();
        rs.setServicioId(s.getServicioId());
        rs.setCodigo(s.getCodigo());
        rs.setNombre(s.getNombre());
        rs.setDescripcion(s.getDescripcion());
        rs.setTipo(s.getTipo().name());
        rs.setEspecializacionId(s.getEspecializacion() == null ? null : s.getEspecializacion().getId());
        rs.setEspecializacionNombre(s.getEspecializacion() == null ? null : s.getEspecializacion().getNombre());
        rs.setValor(s.getValor());
        rs.setIvaPorcentaje(s.getIvaPorcentaje());
        BigDecimal iva = Dinero.porcentaje(s.getValor(), s.getIvaPorcentaje());
        rs.setValorIva(iva);
        rs.setValorTotal(Dinero.redondear(s.getValor().add(iva)));
        rs.setActivo(s.getActivo());
        rs.setFechaModificacion(s.getFechaModificacion());
        return rs;
    }
}
