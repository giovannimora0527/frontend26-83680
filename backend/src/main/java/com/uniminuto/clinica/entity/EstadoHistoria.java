package com.uniminuto.clinica.entity;

/**
 * Estados de una historia clínica.
 * <p>
 * ABIERTA: el paciente sigue en seguimiento y admite nuevas anotaciones.
 * CERRADA: el caso terminó; queda solo para consulta y no admite anotaciones.
 * </p>
 */
public enum EstadoHistoria {
    ABIERTA,
    CERRADA
}
