package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Ingreso de un lote al inventario (entrada por compra).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class LoteRq {
    private Long medicamentoId;
    private String numeroLote;
    private LocalDate fechaCompra;
    private LocalDate fechaVencimiento;
    private BigDecimal precioCompra;
    private Integer cantidad;
    private String observacion;
}
