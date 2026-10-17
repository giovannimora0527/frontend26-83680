package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Solicitud para crear una historia clínica.
 */
@Data
public class HistoriaRq {

    /**
     * Cliente dueño de la mascota.
     */
    private Long clienteId;

    /**
     * Mascota a la que pertenece la historia.
     */
    private Integer mascotaId;

    /**
     * Veterinario que registra la historia (si hay cita, por defecto el de la cita).
     */
    private Long medicoId;

    /**
     * Cita atendida de la mascota que origina la historia (obligatoria).
     */
    private Long citaId;

    /**
     * Motivo de la consulta (si hay cita y no se envía, se toma el de la cita).
     */
    private String motivo;

    /**
     * Diagnóstico del veterinario.
     */
    private String diagnostico;

    /**
     * Observaciones de la consulta (opcional).
     */
    private String observaciones;
}
