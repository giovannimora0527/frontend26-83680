package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.CitaDisponibleRs;
import com.uniminuto.clinica.models.HistoriaFiltroRq;
import com.uniminuto.clinica.models.HistoriaRq;
import com.uniminuto.clinica.models.HistoriaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;

import java.util.List;

/**
 * Operaciones de negocio de las historias clínicas.
 */
public interface HistoriaService {

    /**
     * Lista las historias con paginación, orden y filtros.
     *
     * @param filtro parámetros de consulta.
     * @return página de historias.
     */
    PaginaRs<HistoriaRs> listarHistorias(HistoriaFiltroRq filtro);

    /**
     * Consulta una historia por su identificador.
     *
     * @param historiaId identificador de la historia.
     * @return la historia encontrada.
     */
    HistoriaRs consultarHistoria(Long historiaId);

    /**
     * Crea una historia clínica validando cliente, mascota, veterinario y cita.
     *
     * @param historiaRq datos de la historia.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardarHistoria(HistoriaRq historiaRq);

    /**
     * Lista las citas atendidas de una mascota que aún no tienen historia.
     *
     * @param mascotaId identificador de la mascota.
     * @return citas disponibles para generar una historia.
     */
    List<CitaDisponibleRs> listarCitasDisponibles(Integer mascotaId);

    /**
     * Cierra una historia clínica abierta.
     *
     * @param historiaId identificador de la historia.
     * @return mensaje de éxito.
     */
    MiRespuestaRS cerrarHistoria(Long historiaId);
}
