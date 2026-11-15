package com.uniminuto.clinica.entity;

/**
 * Estados de una entrega (despacho) confirmada.
 */
public enum EstadoEntrega {

    /**
     * La entrega se realizó y descontó el inventario.
     */
    CONFIRMADO,

    /**
     * La entrega se revirtió: las unidades volvieron a sus lotes.
     */
    REVERTIDO
}
