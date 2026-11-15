package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;

/**
 * Unidades entregadas de un medicamento desde un lote.
 */
@Data
public class DespachoDetalleRs {

    /**
     * Nombre del medicamento.
     */
    private String medicamentoNombre;

    /**
     * Código del medicamento.
     */
    private String medicamentoCodigo;

    /**
     * Número del lote usado.
     */
    private String numeroLote;

    /**
     * Vencimiento del lote usado.
     */
    private LocalDate fechaVencimiento;

    /**
     * Unidades entregadas.
     */
    private Integer cantidad;
}
