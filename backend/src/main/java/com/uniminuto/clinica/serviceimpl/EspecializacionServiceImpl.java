package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.EspecializacionRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.EspecializacionRepository;
import com.uniminuto.clinica.service.EspecializacionService;
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EspecializacionServiceImpl implements EspecializacionService {

    @Autowired
    private EspecializacionRepository especializacionRepository;

    @Override
    public List<Especializacion> listarEspecializaciones(boolean soloActivas) {
        return soloActivas ? especializacionRepository.findByActivoTrueOrderByNombreAsc()
                : especializacionRepository.findAllByOrderByNombreAsc();
    }

    @Override
    @Transactional
    public MiRespuestaRS crearEspecializacion(EspecializacionRq rq) {
        validar(rq);
        String codigo = rq.getCodigoEspecializacion().trim().toUpperCase();
        if (especializacionRepository.existsByCodigoEspecializacionIgnoreCase(codigo)) {
            throw new ConflictException("Ya existe una especialidad con el código " + codigo + ".");
        }
        if (especializacionRepository.existsByNombreIgnoreCase(rq.getNombre().trim())) {
            throw new ConflictException("Ya existe una especialidad con el nombre indicado.");
        }
        Especializacion e = new Especializacion();
        e.setCodigoEspecializacion(codigo);
        e.setNombre(rq.getNombre().trim());
        e.setDescripcion(rq.getDescripcion().trim());
        e.setActivo(Boolean.TRUE);
        e.setFechaCreacion(LocalDateTime.now());
        especializacionRepository.save(e);
        return MiRespuestaRS.creado("Especialidad creada correctamente.", e.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS actualizarEspecializacion(EspecializacionRq rq) {
        validar(rq);
        Validar.idValido(rq.getId(), "id");
        Especializacion e = especializacionRepository.findById(rq.getId())
                .orElseThrow(() -> new NotFoundException("La especialidad no existe."));
        String codigo = rq.getCodigoEspecializacion().trim().toUpperCase();
        if (especializacionRepository.existsByCodigoEspecializacionIgnoreCaseAndIdNot(codigo, e.getId())) {
            throw new ConflictException("Ya existe otra especialidad con el código " + codigo + ".");
        }
        if (especializacionRepository.existsByNombreIgnoreCaseAndIdNot(rq.getNombre().trim(), e.getId())) {
            throw new ConflictException("Ya existe otra especialidad con el nombre indicado.");
        }
        e.setCodigoEspecializacion(codigo);
        e.setNombre(rq.getNombre().trim());
        e.setDescripcion(rq.getDescripcion().trim());
        e.setFechaModificacion(LocalDateTime.now());
        especializacionRepository.save(e);
        return MiRespuestaRS.ok("Especialidad actualizada correctamente.", e.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS cambiarEstado(Long id, boolean activo) {
        Validar.idValido(id, "id");
        Especializacion e = especializacionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("La especialidad no existe."));
        e.setActivo(activo);
        e.setFechaModificacion(LocalDateTime.now());
        especializacionRepository.save(e);
        return MiRespuestaRS.ok(activo ? "Especialidad activada." : "Especialidad inactivada.", id);
    }

    private void validar(EspecializacionRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información de la especialidad es obligatoria.");
        }
        String codigo = Validar.texto(rq.getCodigoEspecializacion(), "código", 20);
        if (!codigo.matches("^[A-Za-z0-9_-]{2,20}$")) {
            throw new BadRequestException("El código debe tener entre 2 y 20 caracteres alfanuméricos.");
        }
        Validar.texto(rq.getNombre(), "nombre", 100);
        Validar.texto(rq.getDescripcion(), "descripción", 500);
    }
}
