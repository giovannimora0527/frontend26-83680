package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Solicitud para crear una anotación en una historia clínica.
 */
@Data
public class AnotacionRq {

    /**
     * Historia clínica a la que se agrega la anotación.
     */
    private Long historiaId;

    /**
     * Veterinario que escribe la anotación.
     */
    private Long medicoId;

    /**
     * Descripción de lo observado.
     */
    private String descripcion;

    /**
     * Observación adicional (opcional).
     */
    private String observacion;

    /**
     * Diagnóstico o evolución del paciente.
     */
    private String diagnostico;
}
