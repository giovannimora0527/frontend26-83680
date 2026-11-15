package com.uniminuto.clinica.entity;

/**
 * Tipos de movimiento de inventario.
 */
public enum TipoMovimiento {

    /**
     * Ingreso de un lote nuevo.
     */
    ENTRADA,

    /**
     * Entrega de producto por una dispensación.
     */
    SALIDA,

    /**
     * Corrección manual que aumenta la existencia de un lote.
     */
    AJUSTE_ENTRADA,

    /**
     * Corrección manual que disminuye la existencia de un lote.
     */
    AJUSTE_SALIDA,

    /**
     * Devolución al lote de unidades de una entrega revertida.
     */
    REVERSION;

    /**
     * Indica si el movimiento disminuye la existencia.
     *
     * @return true para SALIDA y AJUSTE_SALIDA.
     */
    public boolean esSalida() {
        return this == SALIDA || this == AJUSTE_SALIDA;
    }
}
