package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Datos de entrada para crear una anotación. La fecha y hora las asigna el servidor.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Data
public class AnotacionRq {

    /** Historia clínica a la que se agrega la anotación. */
    private Long historiaId;

    /** Veterinario que escribe la anotación. */
    private Long medicoId;

    /** Descripción de lo realizado. */
    private String descripcion;

    /** Observación del veterinario. */
    private String observacion;

    /** Diagnóstico o evolución del paciente. */
    private String diagnosticoEvolucion;
}
