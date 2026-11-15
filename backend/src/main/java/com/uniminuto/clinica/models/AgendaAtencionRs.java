package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Cita de la agenda del veterinario con el estado de su atención.
 */
@Data
public class AgendaAtencionRs {

    /** Cita. */
    private Long citaId;

    /** Inicio de la cita. */
    private LocalDateTime inicio;

    /** Fin de la cita. */
    private LocalDateTime fin;

    /** Mascota. */
    private String mascotaNombre;

    /** Propietario. */
    private String clienteNombre;

    /** Motivo de la cita. */
    private String motivo;

    /** Estado de la cita. */
    private String estadoCita;

    /** Atención (historia), si ya se inició. */
    private Long historiaId;

    /** SIN_INICIAR, EN_CURSO o FINALIZADA. */
    private String estadoAtencion;
}
