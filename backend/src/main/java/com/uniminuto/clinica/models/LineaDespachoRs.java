package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * Línea de la fórmula preparada para despacho: lo pendiente y los lotes que
 * se pueden usar, con la selección sugerida.
 */
@Data
public class LineaDespachoRs {

    /**
     * Línea de la fórmula con su avance de entrega.
     */
    private FormulaDetalleRs linea;

    /**
     * Lotes del medicamento con existencias.
     */
    private List<LoteDespachoRs> lotes;

    /**
     * Indica si la existencia vigente alcanza para lo pendiente.
     */
    private boolean alcanza;

    /**
     * Lote del medicamento con existencias para despacho.
     */
    @Data
    public static class LoteDespachoRs {

        /**
         * Identificador del lote.
         */
        private Long loteId;

        /**
         * Número de lote.
         */
        private String numeroLote;

        /**
         * Fecha de vencimiento.
         */
        private LocalDate fechaVencimiento;

        /**
         * Unidades disponibles.
         */
        private Integer disponible;

        /**
         * Estado: VIGENTE, PROXIMO_A_VENCER o VENCIDO.
         */
        private String estado;

        /**
         * Unidades sugeridas, priorizando el vencimiento más próximo.
         */
        private Integer sugerido;
    }
}
