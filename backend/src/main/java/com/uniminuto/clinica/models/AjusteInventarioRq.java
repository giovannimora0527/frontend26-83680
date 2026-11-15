package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Solicitud para corregir manualmente la existencia de un lote.
 */
@Data
public class AjusteInventarioRq {

    /**
     * Sentido del ajuste: ENTRADA o SALIDA.
     */
    private String sentido;

    /**
     * Unidades a ajustar.
     */
    private Integer cantidad;

    /**
     * Motivo de la corrección.
     */
    private String motivo;
}
