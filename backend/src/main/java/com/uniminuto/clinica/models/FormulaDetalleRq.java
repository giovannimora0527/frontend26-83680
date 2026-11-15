package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Medicamento formulado dentro de una solicitud de fórmula.
 */
@Data
public class FormulaDetalleRq {

    /**
     * Medicamento o insumo.
     */
    private Long medicamentoId;

    /**
     * Cantidad por toma.
     */
    private BigDecimal dosis;

    /**
     * Unidad de la dosis.
     */
    private String unidadDosis;

    /**
     * Horas entre tomas.
     */
    private Integer frecuenciaHoras;

    /**
     * Días de tratamiento.
     */
    private Integer duracionDias;

    /**
     * Unidades del producto que se deben entregar.
     */
    private Integer cantidadPrescrita;

    /**
     * Vía de administración.
     */
    private String viaAdministracion;

    /**
     * Indicaciones especiales.
     */
    private String indicaciones;
}
