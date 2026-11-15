package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Cambio de estado de una cita (confirmar, marcar atendida o cancelar).
 */
@Data
public class EstadoCitaRq {

    /**
     * Estado nuevo: PROGRAMADA, CONFIRMADA, ATENDIDA o CANCELADA.
     */
    private String estado;

    /**
     * Motivo u observación (obligatorio para cancelar).
     */
    private String motivo;
}
