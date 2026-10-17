package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.CitaFiltroRq;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.CitaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;

/**
 * Operaciones de negocio para la gestión de citas médicas.
 */
public interface CitaService {

    /**
     * Lista las citas con paginación, ordenamiento y filtros.
     *
     * @param filtro parámetros de página, orden y filtros.
     * @return página de citas.
     */
    PaginaRs<CitaRs> listarCitas(CitaFiltroRq filtro);

    /**
     * Consulta el detalle de una cita.
     *
     * @param citaId identificador de la cita.
     * @return la cita encontrada.
     */
    CitaRs consultarCita(Long citaId);

    /**
     * Registra una nueva cita validando todas las reglas de negocio.
     *
     * @param citaRq datos de la cita.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardarCita(CitaRq citaRq);

    /**
     * Modifica una cita existente según lo que permita su estado.
     *
     * @param citaId identificador de la cita a modificar.
     * @param citaRq nuevos datos de la cita.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizarCita(Long citaId, CitaRq citaRq);

    /**
     * Reactiva una cita cancelada dejándola en estado PENDIENTE.
     *
     * @param citaId identificador de la cita cancelada.
     * @return mensaje de éxito.
     */
    MiRespuestaRS reactivarCita(Long citaId);
}
