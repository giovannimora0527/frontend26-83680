package com.uniminuto.clinica.entity;

/**
 * Tipo de servicio facturable.
 */
public enum TipoServicio {
    /** Consulta médica (una por especialidad). */
    CONSULTA,
    /** Procedimiento realizado en la atención. */
    PROCEDIMIENTO,
    /** Examen de laboratorio. */
    LABORATORIO,
    /** Otro servicio. */
    OTRO
}
