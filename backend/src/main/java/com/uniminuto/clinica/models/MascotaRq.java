package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MascotaRq {
    private Integer mascotaId;
    private String nombre;
    private Integer edad;
    private String sexo;
    private BigDecimal pesoKg;
    private Integer razaId;
    private Long clienteId;
}
