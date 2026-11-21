package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FacturaRq {
    private Long citaId;
    /** Descuento global (0-100). Sólo lo puede autorizar un ADMIN. */
    private BigDecimal porcentajeDescuento;
    private String observaciones;
}
