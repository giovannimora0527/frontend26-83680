package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Respuesta con la información de una cita médica, usada tanto en el listado
 * como en la consulta de detalle.
 */
@Data
public class CitaRs {

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
     * Hora de finalización.
     */
    private LocalTime horaFin;

    /**
     * Fecha y hora de inicio (para el calendario).
     */
    private LocalDateTime inicio;

    /**
     * Fecha y hora de finalización (para el calendario).
     */
    private LocalDateTime fin;

    /**
     * Teléfono del propietario.
     */
    private String clienteTelefono;

    /**
     * Raza de la mascota.
     */
    private String mascotaRaza;

    /**
     * Edad de la mascota en años.
     */
    private Integer mascotaEdad;

    /**
     * Especialidad del veterinario.
     */
    private String especialidad;

    /**
     * Motivo de la cancelación.
     */
    private String motivoCancelacion;

    /**
     * Identificador del cliente dueño de la mascota.
     */
    private Long clienteId;

    /**
     * Nombre completo del cliente.
     */
    private String clienteNombre;

    /**
     * Identificador de la mascota.
     */
    private Integer mascotaId;

    /**
     * Nombre de la mascota.
     */
    private String mascotaNombre;

    /**
     * Identificador del veterinario.
     */
    private Long medicoId;

    /**
     * Nombre completo del veterinario.
     */
    private String medicoNombre;

    /**
     * Motivo de la consulta.
     */
    private String motivo;

    /**
     * Estado actual de la cita.
     */
    private String estado;

    /**
     * Fecha y hora en que se registró la cita.
     */
    private LocalDateTime fechaCreacion;

    /**
     * Fecha y hora de la última modificación, si existe.
     */
    private LocalDateTime fechaModificacion;
}
