package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Motivo de una operación que debe quedar justificada (anular, cancelar, revertir).
 */
@Data
public class MotivoRq {

    /**
     * Motivo de la operación.
     */
    private String motivo;
}
