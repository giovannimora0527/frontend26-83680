package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/**
 * Se lanza cuando la operación choca con información ya existente
 * (por ejemplo, un cruce de horarios o una cita duplicada).
 * El manejador global la traduce a una respuesta HTTP 409.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
public class ConflictException extends RuntimeException {

    /** Estado HTTP asociado a este error. */
    private final HttpStatus status = HttpStatus.CONFLICT;

    /**
     * Crea la excepción con un mensaje comprensible para el usuario final.
     *
     * @param message Mensaje que describe el conflicto.
     */
    public ConflictException(String message) {
        super(message);
    }

    /**
     * Obtiene el estado HTTP asociado.
     *
     * @return Siempre {@link HttpStatus#CONFLICT}.
     */
    public HttpStatus getStatus() {
        return status;
    }
}
