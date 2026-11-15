package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Solicitud para registrar la entrada de un lote al inventario.
 */
@Data
public class LoteRq {

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
     * Fecha de vencimiento (obligatoria para medicamentos).
     */
    private LocalDate fechaVencimiento;

    /**
     * Unidades que ingresan.
     */
    private Integer cantidad;

    /**
     * Precio de compra por unidad.
     */
    private BigDecimal precioCompra;
}
