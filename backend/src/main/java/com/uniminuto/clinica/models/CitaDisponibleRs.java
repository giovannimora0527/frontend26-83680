package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Cita atendida que todavía no tiene historia clínica, para llenar el combo
 * de citas al crear una historia.
 */
@Data
public class CitaDisponibleRs {

    /**
     * Identificador de la cita.
     */
    private Long citaId;

    /**
     * Fecha de la cita.
     */
    private LocalDate fecha;

    /**
     * Hora de la cita.
     */
    private LocalTime hora;

    /**
     * Motivo de la cita.
     */
    private String motivo;

    /**
     * Identificador del veterinario que atendió.
     */
    private Long medicoId;

    /**
     * Nombre del veterinario que atendió.
     */
    private String medicoNombre;
}
