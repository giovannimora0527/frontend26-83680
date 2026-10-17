package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Solicitud para crear o editar un veterinario.
 */
@Data
public class MedicoRq {

    /**
     * Tipo de documento: CC, CE o PA.
     */
    private String tipoDocumento;

    /**
     * Número de documento (único junto con el tipo).
     */
    private String numeroDocumento;

    /**
     * Nombres.
     */
    private String nombres;

    /**
     * Apellidos.
     */
    private String apellidos;

    /**
     * Teléfono de contacto (opcional).
     */
    private String telefono;

    /**
     * Número de registro profesional (único).
     */
    private String registroProfesional;

    /**
     * Especialización del veterinario.
     */
    private Long especializacionId;
}
