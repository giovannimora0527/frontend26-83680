package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PagoRq {
    private Long facturaId;
    private BigDecimal valor;
    /** EFECTIVO, TARJETA_DEBITO, TARJETA_CREDITO, TRANSFERENCIA. */
    private String metodoPago;
    private String referencia;
}
