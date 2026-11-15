package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Cambio de tarifa registrado.
 */
@Data
public class TarifaLogRs {

    /** Fecha del cambio. */
    private LocalDateTime fecha;

    /** Usuario. */
    private String usuario;

    /** Acción. */
    private String accion;

    /** Valor anterior. */
    private BigDecimal valorAnterior;

    /** Valor nuevo. */
    private BigDecimal valorNuevo;

    /** IVA anterior. */
    private BigDecimal ivaAnterior;

    /** IVA nuevo. */
    private BigDecimal ivaNuevo;

    /** Observación. */
    private String observacion;
}
