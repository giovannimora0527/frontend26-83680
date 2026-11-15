package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Servicio que se agrega a una atención.
 */
@Data
public class AtencionServicioRq {

    /** Servicio de la lista de tarifas. */
    private Long servicioId;

    /** Cantidad (1 a 100; por defecto 1). */
    private Integer cantidad;

    /** Observación (opcional). */
    private String observacion;
}
