package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Pago sobre una factura.
 */
@Data
public class PagoRq {

    /** Valor pagado (mayor que 0 y no mayor que el saldo). */
    private BigDecimal valor;

    /** EFECTIVO, TARJETA_DEBITO, TARJETA_CREDITO o TRANSFERENCIA. */
    private String medio;

    /** Referencia del comprobante (obligatoria si no es efectivo). */
    private String referencia;
}
