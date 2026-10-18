package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Datos de entrada para crear una historia clínica.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Data
public class HistoriaClinicaRq {

    /** Cliente dueño de la mascota. */
    private Long clienteId;

    /** Mascota atendida; debe pertenecer al cliente. */
    private Integer mascotaId;

    /** Cita atendida que origina la historia. */
    private Long citaId;

    /** Veterinario que realizó la consulta. */
    private Long medicoId;

    /** Fecha y hora de la consulta; si se omite se usa el momento actual. No puede ser futura. */
    private LocalDateTime fechaHora;

    /** Motivo de la consulta. */
    private String motivoConsulta;

    /** Diagnóstico. */
    private String diagnostico;

    /** Observaciones adicionales (opcional). */
    private String observaciones;
}
