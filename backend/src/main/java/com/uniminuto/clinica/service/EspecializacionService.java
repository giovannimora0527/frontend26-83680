package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.models.EspecializacionRq;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.util.List;

/**
 * Operaciones de negocio de las especializaciones médicas.
 */
public interface EspecializacionService {

    /**
     * Lista las especializaciones ordenadas por nombre.
     *
     * @return lista de especializaciones.
     */
    List<Especializacion> listarEspecializaciones();

    /**
     * Consulta una especialización.
     *
     * @param id identificador.
     * @return la especialización encontrada.
     */
    Especializacion consultarEspecializacion(Long id);

    /**
     * Registra una especialización con nombre y código únicos.
     *
     * @param rq datos de la especialización.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardarEspecializacion(EspecializacionRq rq);

    /**
     * Modifica una especialización manteniendo nombre y código únicos.
     *
     * @param id identificador.
     * @param rq nuevos datos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizarEspecializacion(Long id, EspecializacionRq rq);
}
