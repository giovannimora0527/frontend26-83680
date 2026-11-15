package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Medicamento formulado con su avance de entrega y la existencia disponible.
 */
@Data
public class FormulaDetalleRs {

    /**
     * Identificador de la línea.
     */
    private Long detalleId;

    /**
     * Medicamento.
     */
    private Long medicamentoId;

    /**
     * Código del medicamento.
     */
    private String medicamentoCodigo;

    /**
     * Nombre del medicamento.
     */
    private String medicamentoNombre;

    /**
     * Presentación del medicamento.
     */
    private String presentacion;

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
     * Vía de administración.
     */
    private String viaAdministracion;

    /**
     * Indicaciones especiales.
     */
    private String indicaciones;

    /**
     * Unidades prescritas.
     */
    private Integer cantidadPrescrita;

    /**
     * Unidades ya entregadas.
     */
    private Integer cantidadEntregada;

    /**
     * Unidades pendientes por entregar.
     */
    private Integer cantidadPendiente;

    /**
     * Unidades disponibles en lotes vigentes.
     */
    private Integer disponible;
}
