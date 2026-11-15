package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.EstadoCitaCatalogo;
import com.uniminuto.clinica.models.CitaFiltroRq;
import com.uniminuto.clinica.models.CitaHistorialRs;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.CitaRs;
import com.uniminuto.clinica.models.EstadoCitaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.ReprogramarCitaRq;

import java.time.LocalDate;
import java.util.List;

/**
 * Operaciones de negocio de las citas médicas.
 */
public interface CitaService {

    /**
     * Lista las citas con paginación, orden y filtros.
     *
     * @param filtro parámetros de consulta.
     * @return página de citas.
     */
    PaginaRs<CitaRs> listarCitas(CitaFiltroRq filtro);

    /**
     * Consulta una cita.
     *
     * @param citaId identificador.
     * @return la cita.
     */
    CitaRs consultarCita(Long citaId);

    /**
     * Registra una cita.
     *
     * @param citaRq datos de la cita.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardarCita(CitaRq citaRq);

    /**
     * Modifica una cita (datos, horario o estado).
     *
     * @param citaId identificador.
     * @param citaRq datos nuevos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizarCita(Long citaId, CitaRq citaRq);

    /**
     * Reactiva una cita cancelada.
     *
     * @param citaId identificador.
     * @return mensaje de éxito.
     */
    MiRespuestaRS reactivarCita(Long citaId);

    /**
     * Cambia el estado de una cita (confirmar, atender, cancelar).
     *
     * @param citaId identificador.
     * @param rq     estado nuevo y motivo.
     * @return mensaje de éxito.
     */
    MiRespuestaRS cambiarEstado(Long citaId, EstadoCitaRq rq);

    /**
     * Cambia la fecha y hora de una cita.
     *
     * @param citaId identificador.
     * @param rq     fecha y horas nuevas.
     * @return mensaje de éxito.
     */
    MiRespuestaRS reprogramarCita(Long citaId, ReprogramarCitaRq rq);

    /**
     * Citas de un rango de fechas para el calendario. Para un veterinario
     * siempre son las suyas.
     *
     * @param desde    fecha inicial.
     * @param hasta    fecha final (incluida).
     * @param medicoId veterinario (administrador y recepción; null = todos).
     * @return citas del rango.
     */
    List<CitaRs> calendario(LocalDate desde, LocalDate hasta, Long medicoId);

    /**
     * Historial de cambios de una cita.
     *
     * @param citaId identificador.
     * @return cambios registrados.
     */
    List<CitaHistorialRs> historialCita(Long citaId);

    /**
     * Catálogo de estados de la cita.
     *
     * @return estados con nombre y color.
     */
    List<EstadoCitaCatalogo> listarEstados();

    /**
     * Reporte de citas en Excel.
     *
     * @param desde    fecha inicial.
     * @param hasta    fecha final.
     * @param medicoId veterinario (para el veterinario, siempre el suyo).
     * @param estado   estado (opcional).
     * @return archivo .xlsx.
     */
    byte[] reporteExcel(LocalDate desde, LocalDate hasta, Long medicoId, String estado);
}
