package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.entity.Impuesto;
import com.uniminuto.clinica.entity.Tarifa;
import com.uniminuto.clinica.entity.TarifaHistorial;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.ImpuestoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.TarifaRq;
import com.uniminuto.clinica.repository.EspecializacionRepository;
import com.uniminuto.clinica.repository.ImpuestoRepository;
import com.uniminuto.clinica.repository.TarifaHistorialRepository;
import com.uniminuto.clinica.repository.TarifaRepository;
import com.uniminuto.clinica.service.AuthService;
import com.uniminuto.clinica.service.TarifaService;
import com.uniminuto.clinica.utils.Constantes;
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * Tarifas configurables sin tocar el código. Cada cambio queda en tarifa_historial.
 * Las facturas guardan copia del valor y del impuesto, por lo que un cambio de
 * tarifa no altera facturas ya generadas.
 */
@Service
public class TarifaServiceImpl implements TarifaService {

    @Autowired
    private TarifaRepository tarifaRepository;

    @Autowired
    private TarifaHistorialRepository historialRepository;

    @Autowired
    private ImpuestoRepository impuestoRepository;

    @Autowired
    private EspecializacionRepository especializacionRepository;

    @Autowired
    private AuthService authService;

    @Override
    public List<Tarifa> listarTarifas(boolean soloActivas) {
        return soloActivas ? tarifaRepository.findByActivoTrueOrderByTipoServicioAscNombreAsc()
                : tarifaRepository.findAllByOrderByTipoServicioAscNombreAsc();
    }

    @Override
    public Tarifa consultar(Long id) {
        Validar.idValido(id, "tarifaId");
        return tarifaRepository.findById(id).orElseThrow(() -> new NotFoundException("La tarifa no existe."));
    }

    @Override
    @Transactional
    public MiRespuestaRS crearTarifa(TarifaRq rq) {
        validar(rq);
        String codigo = rq.getCodigo().trim().toUpperCase();
        if (tarifaRepository.existsByCodigoIgnoreCase(codigo)) {
            throw new ConflictException("Ya existe una tarifa con el código " + codigo + ".");
        }
        Tarifa t = new Tarifa();
        t.setCodigo(codigo);
        mapear(t, rq);
        t.setActivo(Boolean.TRUE);
        t.setFechaCreacion(LocalDateTime.now());
        tarifaRepository.save(t);
        registrar(t, "CREACION", null, t.getValor(), null, t.getImpuesto().getCodigo(), "Tarifa creada");
        return MiRespuestaRS.creado("Tarifa creada correctamente.", t.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS actualizarTarifa(TarifaRq rq) {
        validar(rq);
        Tarifa t = consultar(rq.getId());
        String codigo = rq.getCodigo().trim().toUpperCase();
        if (tarifaRepository.existsByCodigoIgnoreCaseAndIdNot(codigo, t.getId())) {
            throw new ConflictException("Ya existe otra tarifa con el código " + codigo + ".");
        }
        BigDecimal valorAnterior = t.getValor();
        String impuestoAnterior = t.getImpuesto().getCodigo();
        List<String> cambios = new ArrayList<>();
        if (!t.getCodigo().equals(codigo)) {
            cambios.add("código " + t.getCodigo() + " → " + codigo);
        }
        if (!t.getNombre().equals(rq.getNombre().trim())) {
            cambios.add("nombre");
        }
        if (!t.getTipoServicio().equals(rq.getTipoServicio().trim().toUpperCase())) {
            cambios.add("tipo de servicio");
        }
        Long espAnterior = t.getEspecializacion() == null ? null : t.getEspecializacion().getId();
        if (!Objects.equals(espAnterior, rq.getEspecializacionId())) {
            cambios.add("especialidad");
        }
        if (!t.getDuracionMinutos().equals(rq.getDuracionMinutos())) {
            cambios.add("duración " + t.getDuracionMinutos() + " → " + rq.getDuracionMinutos() + " min");
        }
        t.setCodigo(codigo);
        mapear(t, rq);
        t.setFechaModificacion(LocalDateTime.now());
        tarifaRepository.save(t);
        boolean cambioValor = valorAnterior.compareTo(t.getValor()) != 0;
        boolean cambioImpuesto = !impuestoAnterior.equals(t.getImpuesto().getCodigo());
        if (cambioValor) {
            cambios.add(0, "valor");
        }
        if (cambioImpuesto) {
            cambios.add("impuesto");
        }
        registrar(t, "MODIFICACION", valorAnterior, t.getValor(), impuestoAnterior, t.getImpuesto().getCodigo(),
                cambios.isEmpty() ? "Sin cambios relevantes" : "Cambios: " + String.join(", ", cambios));
        return MiRespuestaRS.ok("Tarifa actualizada correctamente.", t.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS cambiarEstadoTarifa(Long id, boolean activo) {
        Tarifa t = consultar(id);
        t.setActivo(activo);
        t.setFechaModificacion(LocalDateTime.now());
        tarifaRepository.save(t);
        registrar(t, activo ? "ACTIVACION" : "INACTIVACION", t.getValor(), t.getValor(),
                t.getImpuesto().getCodigo(), t.getImpuesto().getCodigo(), activo ? "Tarifa activada" : "Tarifa inactivada");
        return MiRespuestaRS.ok(activo ? "Tarifa activada." : "Tarifa inactivada.", id);
    }

    @Override
    public List<TarifaHistorial> historial(Long tarifaId) {
        return tarifaId == null ? historialRepository.findAllByOrderByFechaDesc()
                : historialRepository.findByTarifa_IdOrderByFechaDesc(tarifaId);
    }

    @Override
    public List<Impuesto> listarImpuestos() {
        return impuestoRepository.findAllByOrderByCodigoAsc();
    }

    @Override
    @Transactional
    public MiRespuestaRS crearImpuesto(ImpuestoRq rq) {
        validarImpuesto(rq);
        String codigo = rq.getCodigo().trim().toUpperCase();
        if (impuestoRepository.existsByCodigoIgnoreCase(codigo)) {
            throw new ConflictException("Ya existe un impuesto con el código " + codigo + ".");
        }
        Impuesto i = new Impuesto();
        i.setCodigo(codigo);
        i.setNombre(rq.getNombre().trim());
        i.setTipo(rq.getTipo().trim().toUpperCase());
        i.setPorcentaje(Validar.porcentaje(rq.getPorcentaje(), "porcentaje"));
        i.setActivo(Boolean.TRUE);
        i.setFechaCreacion(LocalDateTime.now());
        impuestoRepository.save(i);
        return MiRespuestaRS.creado("Impuesto creado correctamente.", i.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS actualizarImpuesto(ImpuestoRq rq) {
        validarImpuesto(rq);
        Validar.idValido(rq.getId(), "id");
        Impuesto i = impuestoRepository.findById(rq.getId()).orElseThrow(() -> new NotFoundException("El impuesto no existe."));
        String codigo = rq.getCodigo().trim().toUpperCase();
        if (impuestoRepository.existsByCodigoIgnoreCaseAndIdNot(codigo, i.getId())) {
            throw new ConflictException("Ya existe otro impuesto con el código " + codigo + ".");
        }
        i.setCodigo(codigo);
        i.setNombre(rq.getNombre().trim());
        i.setTipo(rq.getTipo().trim().toUpperCase());
        i.setPorcentaje(Validar.porcentaje(rq.getPorcentaje(), "porcentaje"));
        i.setFechaModificacion(LocalDateTime.now());
        impuestoRepository.save(i);
        return MiRespuestaRS.ok("Impuesto actualizado. Las facturas ya generadas conservan el porcentaje anterior.", i.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS cambiarEstadoImpuesto(Long id, boolean activo) {
        Validar.idValido(id, "id");
        Impuesto i = impuestoRepository.findById(id).orElseThrow(() -> new NotFoundException("El impuesto no existe."));
        i.setActivo(activo);
        i.setFechaModificacion(LocalDateTime.now());
        impuestoRepository.save(i);
        return MiRespuestaRS.ok(activo ? "Impuesto activado." : "Impuesto inactivado.", id);
    }

    private void mapear(Tarifa t, TarifaRq rq) {
        t.setNombre(rq.getNombre().trim());
        t.setDescripcion(Validar.limpiar(rq.getDescripcion()));
        t.setTipoServicio(rq.getTipoServicio().trim().toUpperCase());
        t.setValor(Validar.dinero(rq.getValor(), "valor", true));
        t.setDuracionMinutos(rq.getDuracionMinutos());
        Impuesto impuesto = impuestoRepository.findById(rq.getImpuestoId())
                .orElseThrow(() -> new NotFoundException("El impuesto no existe."));
        if (!Boolean.TRUE.equals(impuesto.getActivo())) {
            throw new ConflictException("El impuesto seleccionado está inactivo.");
        }
        t.setImpuesto(impuesto);
        if (rq.getEspecializacionId() == null) {
            t.setEspecializacion(null);
        } else {
            Especializacion esp = especializacionRepository.findById(rq.getEspecializacionId())
                    .orElseThrow(() -> new NotFoundException("La especialidad no existe."));
            t.setEspecializacion(esp);
        }
    }

    private void registrar(Tarifa t, String accion, BigDecimal valorAnterior, BigDecimal valorNuevo,
                           String impAnterior, String impNuevo, String detalle) {
        TarifaHistorial h = new TarifaHistorial();
        h.setTarifa(t);
        h.setAccion(accion);
        h.setValorAnterior(valorAnterior);
        h.setValorNuevo(valorNuevo);
        h.setImpuestoAnterior(impAnterior);
        h.setImpuestoNuevo(impNuevo);
        h.setDetalle(detalle);
        h.setUsuario(authService.usuarioActual());
        h.setFecha(LocalDateTime.now());
        historialRepository.save(h);
    }

    private void validar(TarifaRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información de la tarifa es obligatoria.");
        }
        String codigo = Validar.texto(rq.getCodigo(), "código", 20);
        if (!codigo.matches("^[A-Za-z0-9_-]{2,20}$")) {
            throw new BadRequestException("El código debe tener entre 2 y 20 caracteres (letras, números, guion).");
        }
        Validar.texto(rq.getNombre(), "nombre", 150);
        Validar.textoOpcional(rq.getDescripcion(), "descripción", 500);
        Validar.enLista(rq.getTipoServicio(), Constantes.TIPOS_SERVICIO, "tipo de servicio");
        Validar.dinero(rq.getValor(), "valor", true);
        Validar.idValido(rq.getImpuestoId(), "impuestoId");
        Validar.entero(rq.getDuracionMinutos(), "duración (minutos)", 5, 480);
    }

    private void validarImpuesto(ImpuestoRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información del impuesto es obligatoria.");
        }
        Validar.texto(rq.getCodigo(), "código", 20);
        Validar.texto(rq.getNombre(), "nombre", 100);
        Validar.enLista(rq.getTipo(), Set.of("IVA", "OTRO"), "tipo");
        Validar.obligatorio(rq.getPorcentaje(), "porcentaje");
        Validar.porcentaje(rq.getPorcentaje(), "porcentaje");
    }
}
