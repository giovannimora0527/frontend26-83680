package com.uniminuto.clinica.models;

import lombok.Data;

import java.util.List;

/**
 * Solicitud para confirmar una entrega de medicamentos.
 */
@Data
public class DespachoRq {

    /**
     * Observación de la entrega (opcional).
     */
    private String observacion;

    /**
     * Unidades entregadas por línea y lote.
     */
    private List<EntregaRq> entregas;
}
