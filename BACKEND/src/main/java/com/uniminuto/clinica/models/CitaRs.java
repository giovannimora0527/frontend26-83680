package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Datos de salida de una cita. Incluye los ids (para los formularios) y los nombres
 * ya resueltos (para mostrar en el listado sin consultas adicionales).
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Data
public class CitaRs {

    /** Identificador de la cita. */
    private Long id;

    /** Identificador del cliente. */
    private Long clienteId;

    /** Nombre completo del cliente. */
    private String clienteNombre;

    /** Identificador de la mascota. */
    private Integer mascotaId;

    /** Nombre de la mascota. */
    private String mascotaNombre;

    /** Identificador del veterinario. */
    private Long medicoId;

    /** Nombre completo del veterinario. */
    private String medicoNombre;

    /** Fecha y hora de la cita. */
    private LocalDateTime fechaHora;

    /** Motivo de la consulta. */
    private String motivo;

    /** Estado actual de la cita. */
    private String estado;
}
