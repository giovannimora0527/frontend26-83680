package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.RazaRq;

import java.util.List;

/**
 * Operaciones de negocio de las razas.
 */
public interface RazaService {

    /**
     * Lista las razas ordenadas por especie y nombre.
     *
     * @return lista de razas.
     */
    List<Raza> listarRazas();

    /**
     * Consulta una raza.
     *
     * @param razaId identificador de la raza.
     * @return la raza encontrada.
     */
    Raza consultarRaza(Integer razaId);

    /**
     * Registra una raza validando que no esté repetida en la especie.
     *
     * @param razaRq datos de la raza.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardarRaza(RazaRq razaRq);

    /**
     * Modifica una raza validando que no quede repetida en la especie.
     *
     * @param razaId identificador de la raza.
     * @param razaRq nuevos datos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizarRaza(Integer razaId, RazaRq razaRq);
}
