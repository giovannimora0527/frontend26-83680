package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/**
 * Se lanza cuando un registro solicitado (cliente, mascota, cita, etc.) no existe.
 * El manejador global la traduce a una respuesta HTTP 404.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
public class ResourceNotFoundException extends RuntimeException {

    /** Estado HTTP asociado a este error. */
    private final HttpStatus status = HttpStatus.NOT_FOUND;

    /**
     * Crea la excepción con un mensaje comprensible para el usuario final.
     *
     * @param message Mensaje que describe qué registro no se encontró.
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }

    /**
     * Obtiene el estado HTTP asociado.
     *
     * @return Siempre {@link HttpStatus#NOT_FOUND}.
     */
    public HttpStatus getStatus() {
        return status;
    }
}
