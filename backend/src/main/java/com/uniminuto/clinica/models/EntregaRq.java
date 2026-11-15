package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Unidades que se entregan de una línea de la fórmula desde un lote.
 */
@Data
public class EntregaRq {

    /**
     * Línea de la fórmula.
     */
    private Long formulaDetalleId;

    /**
     * Lote del que salen las unidades.
     */
    private Long loteId;

    /**
     * Unidades a entregar.
     */
    private Integer cantidad;
}
