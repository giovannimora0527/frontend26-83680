package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;

/**
 * Datos de entrada para crear o actualizar una fórmula médica.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Data
public class FormulaRq {

    /** Mascota a la que se formula; debe coincidir con la mascota de la historia. */
    private Integer mascotaId;

    /** Historia clínica (consulta) a la que pertenece la fórmula. */
    private Long historiaId;

    /** Veterinario que emite la fórmula. */
    private Long medicoId;

    /** Medicamento formulado. */
    private Long medicamentoId;

    /** Fecha de emisión; no puede ser anterior a la fecha de la consulta. */
    private LocalDate fechaEmision;

    /** Dosis con número y unidad (ej. "5 mg"). */
    private String dosis;

    /** Frecuencia (ej. "cada 8 horas"). */
    private String frecuencia;

    /** Duración del tratamiento en días (1 a 365). */
    private Integer duracionDias;

    /** Indicaciones de administración. */
    private String indicaciones;
}
