package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Pago registrado.
 */
@Data
public class PagoRs {

    /** Identificador. */
    private Long pagoId;

    /** Fecha y hora. */
    private LocalDateTime fecha;

    /** Valor. */
    private BigDecimal valor;

    /** Medio de pago. */
    private String medio;

    /** Referencia. */
    private String referencia;

    /** Usuario que lo registró. */
    private String usuario;
}
