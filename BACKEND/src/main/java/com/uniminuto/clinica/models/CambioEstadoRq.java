package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Datos de entrada para cambiar únicamente el estado de un registro.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Data
public class CambioEstadoRq {

    /** Nuevo estado solicitado. */
    private String estado;
}
