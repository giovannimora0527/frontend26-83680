package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Detalle completo de una fórmula médica (lo que muestra el botón "Ver" y precarga la edición).
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Data
public class FormulaDetalleRs {

    /** Identificador de la fórmula. */
    private Long id;

    /** Identificador de la mascota. */
    private Integer mascotaId;

    /** Nombre de la mascota. */
    private String mascotaNombre;

    /** Nombre completo del cliente dueño. */
    private String clienteNombre;

    /** Identificador de la historia clínica. */
    private Long historiaId;

    /** Identificador de la cita (consulta). */
    private Long citaId;

    /** Fecha y hora de la consulta asociada. */
    private LocalDateTime fechaConsulta;

    /** Identificador del veterinario. */
    private Long medicoId;

    /** Nombre completo del veterinario. */
    private String medicoNombre;

    /** Identificador del medicamento. */
    private Long medicamentoId;

    /** Nombre del medicamento. */
    private String medicamentoNombre;

    /** Fecha de emisión. */
    private LocalDate fechaEmision;

    /** Dosis. */
    private String dosis;

    /** Frecuencia. */
    private String frecuencia;

    /** Duración en días. */
    private Integer duracionDias;

    /** Indicaciones. */
    private String indicaciones;

    /** Indica si la fórmula está activa. */
    private Boolean activa;

    /** Fecha y hora de creación del registro. */
    private LocalDateTime fechaCreacion;

    /** Fecha y hora de la última actualización. */
    private LocalDateTime fechaActualizacion;
}
