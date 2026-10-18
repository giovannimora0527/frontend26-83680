package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Datos de salida de una anotación.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Data
public class AnotacionRs {

    /** Identificador de la anotación. */
    private Long id;

    /** Identificador de la historia clínica. */
    private Long historiaId;

    /** Identificador del veterinario. */
    private Long medicoId;

    /** Nombre completo del veterinario. */
    private String medicoNombre;

    /** Fecha y hora de la anotación. */
    private LocalDateTime fecha;

    /** Descripción. */
    private String descripcion;

    /** Observación. */
    private String observacion;

    /** Diagnóstico o evolución. */
    private String diagnosticoEvolucion;
}
