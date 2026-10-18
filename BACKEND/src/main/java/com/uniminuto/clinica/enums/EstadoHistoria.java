package com.uniminuto.clinica.enums;

/**
 * Estados de una historia clínica. Una historia cerrada ya no admite nuevas anotaciones,
 * lo que protege el registro clínico una vez finalizada la atención.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
public enum EstadoHistoria {
    /** Historia en curso: admite anotaciones. */
    ABIERTA,
    /** Historia finalizada: solo lectura. */
    CERRADA
}
