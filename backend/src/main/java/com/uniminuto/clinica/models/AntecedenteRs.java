package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Atención anterior de la mascota (antecedente médico).
 */
@Data
public class AntecedenteRs {

    /** Historia clínica. */
    private Long historiaId;

    /** Fecha de la consulta. */
    private LocalDateTime fechaHora;

    /** Veterinario. */
    private String medicoNombre;

    /** Motivo. */
    private String motivo;

    /** Síntomas. */
    private String sintomas;

    /** Diagnóstico. */
    private String diagnostico;

    /** Recomendaciones. */
    private String recomendaciones;
}
