package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Respuesta con los datos de una anotación.
 */
@Data
public class AnotacionRs {

    /**
     * Identificador de la anotación.
     */
    private Long anotacionId;

    /**
     * Historia a la que pertenece.
     */
    private Long historiaId;

    /**
     * Identificador del veterinario autor.
     */
    private Long medicoId;

    /**
     * Nombre completo del veterinario autor.
     */
    private String medicoNombre;

    /**
     * Descripción de lo observado.
     */
    private String descripcion;

    /**
     * Observación adicional.
     */
    private String observacion;

    /**
     * Diagnóstico o evolución del paciente.
     */
    private String diagnostico;

    /**
     * Fecha y hora en que se escribió.
     */
    private LocalDateTime fechaCreacion;
}
