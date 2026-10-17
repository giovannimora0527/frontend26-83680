package com.uniminuto.clinica.entity;

/**
 * Estados de una fórmula médica. Una fórmula está ligada a información
 * clínica, así que no se elimina: se pasa a INACTIVA y ya no se puede editar.
 */
public enum EstadoFormula {
    ACTIVA,
    INACTIVA
}
