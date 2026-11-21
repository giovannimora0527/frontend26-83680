package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.CitaHistorial;
import com.uniminuto.clinica.entity.EstadoCita;
import com.uniminuto.clinica.models.CambioEstadoRq;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.ReporteData;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface CitaService {

    List<Cita> listarCitas(LocalDate fechaInicial, LocalDate fechaFinal, Long medicoId, String estado);

    List<Cita> listarCitasRango(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    /** Citas del veterinario autenticado para el calendario. */
    List<Cita> agendaMedico(LocalDateTime inicio, LocalDateTime fin);

    Cita consultar(Long citaId);

    List<Cita> listarCitasPorMascota(Integer mascotaId);

    List<CitaHistorial> historial(Long citaId);

    List<EstadoCita> estados();

    Map<String, Long> resumenEstados(LocalDate fechaInicial, LocalDate fechaFinal);

    MiRespuestaRS crearCita(CitaRq rq);

    MiRespuestaRS actualizarCita(CitaRq rq);

    MiRespuestaRS reprogramar(CambioEstadoRq rq);

    MiRespuestaRS cambiarEstado(CambioEstadoRq rq);

    MiRespuestaRS reactivar(Long citaId);

    /** Reporte de citas del veterinario (el autenticado si es MEDICO). */
    ReporteData reporteCitasMedico(LocalDate fechaInicial, LocalDate fechaFinal, Long medicoId);
}
