package com.uniminuto.clinica.entity;

/**
 * Estados de pago de una factura.
 */
public enum EstadoFactura {
    /** Generada, sin pagos. */
    PENDIENTE_PAGO,
    /** Con pagos que no cubren el total. */
    PAGO_PARCIAL,
    /** Pagada por completo. */
    PAGADA,
    /** Anulada mediante el procedimiento controlado; se conserva como registro. */
    ANULADA
}
