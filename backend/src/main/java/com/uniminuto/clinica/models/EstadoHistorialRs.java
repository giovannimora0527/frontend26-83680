package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Cambio de estado de una fórmula o de su despacho.
 */
@Data
public class EstadoHistorialRs {

    /**
     * Fecha y hora del cambio.
     */
    private LocalDateTime fecha;

    /**
     * Estado anterior.
     */
    private String estadoAnterior;

    /**
     * Estado nuevo.
     */
    private String estadoNuevo;

    /**
     * Usuario responsable.
     */
    private String usuario;

    /**
     * Observación o motivo.
     */
    private String observacion;
}
