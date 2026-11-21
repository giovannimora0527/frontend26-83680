package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CitaRq {
    private Long id;
    private Integer mascotaId;
    private Long medicoId;
    /** Tipo de consulta / servicio (define la duración por defecto). */
    private Long tarifaId;
    private LocalDateTime fechaHora;
    /** Opcional: si no llega se calcula con la duración de la tarifa (o 30 min). */
    private LocalDateTime fechaHoraFin;
    private String motivo;
    /** Sólo al crear: PENDIENTE, PROGRAMADA o CONFIRMADA (por defecto PROGRAMADA). */
    private String estado;
}
