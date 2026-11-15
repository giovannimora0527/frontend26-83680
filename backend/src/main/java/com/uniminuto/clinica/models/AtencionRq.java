package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Datos clínicos de la atención (se pueden guardar varias veces mientras está abierta).
 */
@Data
public class AtencionRq {

    /** Motivo de consulta. */
    private String motivo;

    /** Síntomas identificados. */
    private String sintomas;

    /** Diagnóstico. */
    private String diagnostico;

    /** Observaciones médicas. */
    private String observaciones;

    /** Recomendaciones para el propietario. */
    private String recomendaciones;
}
