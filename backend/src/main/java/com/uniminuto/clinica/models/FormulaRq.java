package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Fórmula médica (encabezado + medicamentos prescritos).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FormulaRq {
    private Long id;
    private Long citaId;
    private String indicaciones;
    private List<Detalle> detalles;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Detalle {
        private Long medicamentoId;
        /** Texto de la dosis: "1 tableta", "2 ml". */
        private String dosis;
        /** Unidades de inventario por toma (para calcular la cantidad total). */
        private BigDecimal dosisCantidad;
        private Integer frecuenciaHoras;
        private Integer duracionDias;
        /** Opcional: si no llega se calcula = dosis x tomas. */
        private Integer cantidadPrescrita;
        private String viaAdministracion;
        private String indicaciones;
    }
}
