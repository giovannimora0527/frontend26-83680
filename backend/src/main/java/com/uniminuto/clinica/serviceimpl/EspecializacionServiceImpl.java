package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.EspecializacionRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.EspecializacionRepository;
import com.uniminuto.clinica.service.EspecializacionService;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Implementación de las reglas de negocio de las especializaciones: nombre y
 * código obligatorios y únicos; el código se guarda en mayúsculas.
 */
@Service
public class EspecializacionServiceImpl implements EspecializacionService {

    /**
     * Código: 2 a 10 letras, números o guiones.
     */
    private static final Pattern CODIGO = Pattern.compile("^[A-Z0-9-]{2,10}$");

    /**
     * Identificador que no existe, para reutilizar las consultas "IdNot" al crear.
     */
    private static final Long SIN_ID = -1L;

    /**
     * Repositorio de especializaciones.
     */
    @Autowired
    private EspecializacionRepository especializacionRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Especializacion> listarEspecializaciones() {
        return especializacionRepository.findAll(Sort.by("nombre"));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Especializacion consultarEspecializacion(Long id) {
        return especializacionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("La especialización no existe"));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarEspecializacion(EspecializacionRq rq) {
        Especializacion especializacion = new Especializacion();
        this.aplicarDatos(especializacion, rq, SIN_ID);
        especializacionRepository.save(especializacion);
        return MiRespuestaRS.de(201, "Especialización registrada correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarEspecializacion(Long id, EspecializacionRq rq) {
        Especializacion especializacion = this.consultarEspecializacion(id);
        this.aplicarDatos(especializacion, rq, id);
        especializacionRepository.save(especializacion);
        return MiRespuestaRS.de(200, "Especialización actualizada correctamente");
    }

    /**
     * Valida los datos (incluida la unicidad) y los copia a la especialización.
     *
     * @param especializacion especialización a completar.
     * @param rq              datos recibidos.
     * @param id              identificador que se edita (SIN_ID al crear).
     */
    private void aplicarDatos(Especializacion especializacion, EspecializacionRq rq, Long id) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos de la especialización");
        }
        String codigo = Validaciones.conPatron(
                rq.getCodigoEspecializacion() == null ? null : rq.getCodigoEspecializacion().trim().toUpperCase(),
                "El código", 10, CODIGO, "El código debe tener de 2 a 10 letras, números o guiones");
        String nombre = Validaciones.obligatorio(rq.getNombre(), "El nombre", 100);

        if (especializacionRepository.existsByCodigoEspecializacionIgnoreCaseAndIdNot(codigo, id)) {
            throw new ConflictException("Ya existe una especialización con el código " + codigo);
        }
        if (especializacionRepository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw new ConflictException("Ya existe una especialización llamada " + nombre);
        }

        especializacion.setCodigoEspecializacion(codigo);
        especializacion.setNombre(nombre);
        especializacion.setDescripcion(Validaciones.opcional(rq.getDescripcion(), "La descripción", 255));
    }
}
