package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Cambio de estado o reprogramación de una cita.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CambioEstadoRq {
    private Long citaId;
    private String estado;
    private String observacion;
    private LocalDateTime fechaHora;
    private LocalDateTime fechaHoraFin;
}
