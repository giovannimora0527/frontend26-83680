package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalTime;

/**
 * Franja semanal de atención de un veterinario.
 */
@Data
public class HorarioRq {

    /**
     * Día de la semana: 1 = lunes ... 7 = domingo.
     */
    private Integer diaSemana;

    /**
     * Hora de inicio (HH:mm).
     */
    private LocalTime horaInicio;

    /**
     * Hora de fin (HH:mm).
     */
    private LocalTime horaFin;
}
