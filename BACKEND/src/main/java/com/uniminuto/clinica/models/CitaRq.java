package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Datos de entrada para crear o actualizar una cita.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Data
public class CitaRq {

    /** Identificador del cliente dueño de la mascota. */
    private Long clienteId;

    /** Identificador de la mascota; debe pertenecer al cliente indicado. */
    private Integer mascotaId;

    /** Identificador del veterinario asignado. */
    private Long medicoId;

    /** Fecha y hora de la cita en formato ISO (ej. 2026-10-20T09:30:00). */
    private LocalDateTime fechaHora;

    /** Motivo de la consulta. */
    private String motivo;

    /** Estado de la cita; si se omite al crear, se asigna PENDIENTE. */
    private String estado;
}
