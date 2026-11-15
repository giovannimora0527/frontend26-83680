package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalTime;

/**
 * Franja semanal de atención de un veterinario.
 */
@Data
public class HorarioRs {

    /**
     * Identificador de la franja.
     */
    private Long horarioId;

    /**
     * Día de la semana: 1 = lunes ... 7 = domingo.
     */
    private Integer diaSemana;

    /**
     * Hora de inicio.
     */
    private LocalTime horaInicio;

    /**
     * Hora de fin.
     */
    private LocalTime horaFin;
}
