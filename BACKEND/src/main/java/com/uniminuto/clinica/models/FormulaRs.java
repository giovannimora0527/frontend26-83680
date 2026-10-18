package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Resumen de una fórmula médica para el listado (sin frecuencia, duración ni indicaciones).
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Data
public class FormulaRs {

    /** Identificador de la fórmula. */
    private Long id;

    /** Nombre de la mascota. */
    private String mascotaNombre;

    /** Nombre completo del veterinario. */
    private String medicoNombre;

    /** Nombre del medicamento. */
    private String medicamentoNombre;

    /** Dosis. */
    private String dosis;

    /** Fecha de emisión. */
    private LocalDate fechaEmision;

    /** Fecha y hora de creación del registro. */
    private LocalDateTime fechaCreacion;

    /** Indica si la fórmula está activa. */
    private Boolean activa;
}
