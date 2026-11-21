package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class EspecializacionRq {
    private Long id;
    private String codigoEspecializacion;
    private String nombre;
    private String descripcion;
}
