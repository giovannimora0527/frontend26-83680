package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;

/**
 * Solicitud para crear o editar un cliente.
 */
@Data
public class ClienteRq {

    /**
     * Tipo de documento: CC, CE, TI, PA o NIT.
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
     * Fecha de nacimiento.
     */
    private LocalDate fechaNacimiento;

    /**
     * Género: M, F u O (opcional).
     */
    private String genero;

    /**
     * Teléfono de contacto.
     */
    private String telefono;

    /**
     * Dirección (opcional).
     */
    private String direccion;
}
