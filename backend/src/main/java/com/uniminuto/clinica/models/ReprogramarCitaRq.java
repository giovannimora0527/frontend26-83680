package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Nueva fecha y hora de una cita (por ejemplo, al arrastrarla en el calendario).
 */
@Data
public class ReprogramarCitaRq {

    /**
     * Nueva fecha.
     */
    private LocalDate fecha;

    /**
     * Nueva hora de inicio.
     */
    private LocalTime hora;

    /**
     * Nueva hora de fin (opcional: conserva la duración actual).
     */
    private LocalTime horaFin;

    /**
     * Observación de la reprogramación.
     */
    private String observacion;
}
