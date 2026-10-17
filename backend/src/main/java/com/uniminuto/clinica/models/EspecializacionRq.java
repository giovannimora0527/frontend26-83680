package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Solicitud para crear o editar una especialización médica.
 */
@Data
public class EspecializacionRq {

    /**
     * Nombre (único).
     */
    private String nombre;

    /**
     * Descripción del área (opcional).
     */
    private String descripcion;

    /**
     * Código corto y único (2 a 10 letras, números o guiones).
     */
    private String codigoEspecializacion;
}
