package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.AnotacionFiltroRq;
import com.uniminuto.clinica.models.AnotacionRq;
import com.uniminuto.clinica.models.AnotacionRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;

/**
 * Operaciones de negocio de las anotaciones de historias clínicas.
 */
public interface AnotacionService {

    /**
     * Lista las anotaciones de una historia con paginación y orden.
     *
     * @param filtro parámetros de consulta (la historia es obligatoria).
     * @return página de anotaciones.
     */
    PaginaRs<AnotacionRs> listarAnotaciones(AnotacionFiltroRq filtro);

    /**
     * Consulta una anotación por su identificador.
     *
     * @param anotacionId identificador de la anotación.
     * @return la anotación encontrada.
     */
    AnotacionRs consultarAnotacion(Long anotacionId);

    /**
     * Crea una anotación en una historia existente.
     *
     * @param anotacionRq datos de la anotación.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardarAnotacion(AnotacionRq anotacionRq);
}
