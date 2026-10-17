package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.RazaRq;
import com.uniminuto.clinica.repository.RazaRepository;
import com.uniminuto.clinica.service.RazaService;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementación de las reglas de negocio de las razas: nombre y especie
 * obligatorios, solo letras, y una misma raza no se repite dentro de la especie.
 */
@Service
public class RazaServiceImpl implements RazaService {

    /**
     * Longitud máxima del nombre y de la especie.
     */
    private static final int MAXIMO_TEXTO = 100;

    /**
     * Repositorio de razas.
     */
    @Autowired
    private RazaRepository razaRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Raza> listarRazas() {
        return razaRepository.findAll(Sort.by("especie").ascending().and(Sort.by("nombre")));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Raza consultarRaza(Integer razaId) {
        return razaRepository.findById(razaId)
                .orElseThrow(() -> new NotFoundException("La raza no existe"));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarRaza(RazaRq rq) {
        Raza raza = new Raza();
        this.aplicarDatos(raza, rq);
        if (razaRepository.existsByNombreIgnoreCaseAndEspecieIgnoreCase(raza.getNombre(), raza.getEspecie())) {
            throw new ConflictException("Ya existe la raza " + raza.getNombre() + " en la especie " + raza.getEspecie());
        }
        raza.setFechaCreacion(LocalDateTime.now());
        razaRepository.save(raza);
        return MiRespuestaRS.de(201, "Raza registrada correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarRaza(Integer razaId, RazaRq rq) {
        Raza raza = this.consultarRaza(razaId);
        // Se valida sobre una copia: si se modificara la entidad antes de la consulta de
        // duplicados, Hibernate la guardaría primero y fallaría la restricción única.
        Raza datos = new Raza();
        this.aplicarDatos(datos, rq);
        if (razaRepository.existsByNombreIgnoreCaseAndEspecieIgnoreCaseAndRazaIdNot(
                datos.getNombre(), datos.getEspecie(), razaId)) {
            throw new ConflictException("Ya existe la raza " + datos.getNombre() + " en la especie " + datos.getEspecie());
        }
        raza.setNombre(datos.getNombre());
        raza.setEspecie(datos.getEspecie());
        raza.setFechaModificacion(LocalDateTime.now());
        razaRepository.save(raza);
        return MiRespuestaRS.de(200, "Raza actualizada correctamente");
    }

    /**
     * Valida los datos recibidos y los copia a la raza.
     *
     * @param raza raza a completar.
     * @param rq   datos recibidos.
     */
    private void aplicarDatos(Raza raza, RazaRq rq) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos de la raza");
        }
        raza.setNombre(Validaciones.conPatron(rq.getNombre(), "El nombre de la raza", MAXIMO_TEXTO,
                Validaciones.SOLO_LETRAS, "El nombre de la raza solo puede contener letras"));
        raza.setEspecie(Validaciones.conPatron(rq.getEspecie(), "La especie", MAXIMO_TEXTO,
                Validaciones.SOLO_LETRAS, "La especie solo puede contener letras"));
    }
}
