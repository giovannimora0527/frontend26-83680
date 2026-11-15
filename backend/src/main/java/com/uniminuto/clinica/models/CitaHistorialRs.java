package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Cambio registrado sobre una cita.
 */
@Data
public class CitaHistorialRs {

    /**
     * Fecha y hora del cambio.
     */
    private LocalDateTime fecha;

    /**
     * Usuario que hizo el cambio.
     */
    private String usuario;

    /**
     * CREADA, EDITADA, REPROGRAMADA, ESTADO o REACTIVADA.
     */
    private String accion;

    /**
     * Estado anterior.
     */
    private String estadoAnterior;

    /**
     * Estado nuevo.
     */
    private String estadoNuevo;

    /**
     * Inicio anterior.
     */
    private LocalDateTime inicioAnterior;

    /**
     * Inicio nuevo.
     */
    private LocalDateTime inicioNuevo;

    /**
     * Observación o motivo.
     */
    private String observacion;
}
