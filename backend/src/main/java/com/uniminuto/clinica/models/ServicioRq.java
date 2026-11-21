package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Servicio (tarifa) prestado durante una atención.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ServicioRq {
    private Long citaId;
    private Long tarifaId;
    private Integer cantidad;
    private String observacion;
}
