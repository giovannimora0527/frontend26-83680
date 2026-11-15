package com.uniminuto.clinica.models;

import lombok.Data;

import java.util.List;

/**
 * Información para preparar el despacho de una fórmula.
 */
@Data
public class PreparacionDespachoRs {

    /**
     * Fórmula con su historial y entregas anteriores.
     */
    private FormulaRs formula;

    /**
     * Líneas con lo pendiente y los lotes disponibles.
     */
    private List<LineaDespachoRs> lineas;
}
