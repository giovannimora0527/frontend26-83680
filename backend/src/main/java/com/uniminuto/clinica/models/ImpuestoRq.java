package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ImpuestoRq {
    private Long id;
    private String codigo;
    private String nombre;
    /** IVA u OTRO. */
    private String tipo;
    private BigDecimal porcentaje;
}
