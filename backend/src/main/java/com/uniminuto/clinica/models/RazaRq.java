package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Solicitud para crear o editar una raza.
 */
@Data
public class RazaRq {

    /**
     * Nombre de la raza (único dentro de la especie).
     */
    private String nombre;

    /**
     * Especie a la que pertenece.
     */
    private String especie;
}
