package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/**
 * Se lanza cuando la petición es válida en formato pero viola una regla de negocio
 * (por ejemplo, modificar una cita cancelada o usar una mascota de otro cliente).
 * El manejador global la traduce a una respuesta HTTP 422.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
public class BusinessRuleException extends RuntimeException {

    /** Estado HTTP asociado a este error. */
    private final HttpStatus status = HttpStatus.UNPROCESSABLE_ENTITY;

    /**
     * Crea la excepción con un mensaje comprensible para el usuario final.
     *
     * @param message Mensaje que describe la regla de negocio incumplida.
     */
    public BusinessRuleException(String message) {
        super(message);
    }

    /**
     * Obtiene el estado HTTP asociado.
     *
     * @return Siempre {@link HttpStatus#UNPROCESSABLE_ENTITY}.
     */
    public HttpStatus getStatus() {
        return status;
    }
}
