package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Lote de un producto con su estado calculado.
 */
@Data
public class LoteRs {

    /**
     * Identificador del lote.
     */
    private Long loteId;

    /**
     * Número de lote.
     */
    private String numeroLote;

    /**
     * Fecha de compra.
     */
    private LocalDate fechaCompra;

    /**
     * Fecha de ingreso al inventario.
     */
    private LocalDate fechaIngreso;

    /**
     * Fecha de vencimiento.
     */
    private LocalDate fechaVencimiento;

    /**
     * Cantidad con la que ingresó.
     */
    private Integer cantidadInicial;

    /**
     * Cantidad disponible.
     */
    private Integer cantidadDisponible;

    /**
     * Precio de compra por unidad.
     */
    private BigDecimal precioCompra;

    /**
     * Estado: VIGENTE, PROXIMO_A_VENCER, VENCIDO o AGOTADO.
     */
    private String estado;
}
