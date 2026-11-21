package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TarifaRq {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String tipoServicio;
    /** Opcional: tarifa general si es null. */
    private Long especializacionId;
    private BigDecimal valor;
    private Long impuestoId;
    private Integer duracionMinutos;
}
