package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Respuesta con los datos de una historia clínica, para el listado y el detalle.
 */
@Data
public class HistoriaRs {

    /**
     * Identificador de la historia.
     */
    private Long historiaId;

    /**
     * Fecha de la atención.
     */
    private LocalDate fecha;

    /**
     * Hora de la atención.
     */
    private LocalTime hora;

    /**
     * Identificador del cliente.
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
     * Cita atendida que originó la historia (nulo en historias anteriores a esta regla).
     */
    private Long citaId;

    /**
     * Motivo de la consulta.
     */
    private String motivo;

    /**
     * Diagnóstico.
     */
    private String diagnostico;

    /**
     * Observaciones de la consulta.
     */
    private String observaciones;

    /**
     * Estado de la historia (ABIERTA o CERRADA).
     */
    private String estado;

    /**
     * Cantidad de anotaciones de la historia.
     */
    private long totalAnotaciones;

    /**
     * Fecha y hora de creación del registro.
     */
    private LocalDateTime fechaCreacion;
}
