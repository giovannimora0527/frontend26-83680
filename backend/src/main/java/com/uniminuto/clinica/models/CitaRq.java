package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Solicitud para crear o editar una cita médica.
 */
@Data
public class CitaRq {

    /**
     * Identificador del cliente dueño de la mascota (obligatorio al crear).
     */
    private Long clienteId;

    /**
     * Identificador de la mascota que será atendida (obligatorio al crear).
     */
    private Integer mascotaId;

    /**
     * Identificador del veterinario que atenderá la cita.
     */
    private Long medicoId;

    /**
     * Fecha de la cita, con formato yyyy-MM-dd.
     */
    private LocalDate fecha;

    /**
     * Hora de la cita, con formato HH:mm.
     */
    private LocalTime hora;

    /**
     * Motivo de la consulta.
     */
    private String motivo;

    /**
     * Estado de la cita: PENDIENTE, CONFIRMADA, ATENDIDA, CANCELADA o PROGRAMADA.
     */
    private String estado;
}
