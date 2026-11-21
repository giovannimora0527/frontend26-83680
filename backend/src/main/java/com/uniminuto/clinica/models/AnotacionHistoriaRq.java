package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AnotacionHistoriaRq {
    private Long historiaId;
    private String descripcion;
    private String diagnostico;
    private String observaciones;
}
