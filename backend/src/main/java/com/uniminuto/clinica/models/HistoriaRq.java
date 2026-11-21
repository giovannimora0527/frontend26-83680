package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Datos clínicos registrados durante la atención de una cita.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class HistoriaRq {
    private Long citaId;
    private String motivo;
    private String sintomas;
    private String diagnostico;
    private String observaciones;
    private String recomendaciones;
    private BigDecimal pesoKg;
    private BigDecimal temperaturaC;
}
