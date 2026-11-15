package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Generación de la factura de una atención.
 */
@Data
public class FacturaRq {

    /** Atención finalizada a facturar. */
    private Long historiaId;

    /** Descuento en pesos (solo lo autoriza el administrador). */
    private BigDecimal descuento;

    /** Motivo del descuento (obligatorio si hay descuento). */
    private String motivoDescuento;
}
