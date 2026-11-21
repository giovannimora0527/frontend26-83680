package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

/**
 * Reemplaza los horarios de disponibilidad de un veterinario.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class HorarioRq {
    private Long medicoId;
    private List<Bloque> horarios;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Bloque {
        /** 1 = lunes ... 7 = domingo. */
        private Integer diaSemana;
        private LocalTime horaInicio;
        private LocalTime horaFin;
    }
}
