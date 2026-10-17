package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción lanzada cuando un registro solicitado no existe en el sistema
 * (cliente, mascota, veterinario, cita, etc.).
 * El {@link GlobalExceptionHandler} la traduce a una respuesta HTTP 404.
 */
public class NotFoundException extends RuntimeException {

    /**
     * Código HTTP asociado a la excepción.
     */
    private final HttpStatus status;

    /**
     * Crea la excepción con el mensaje que verá el usuario.
     *
     * @param message mensaje que describe qué registro no se encontró.
     */
    public NotFoundException(String message) {
        super(message);
        this.status = HttpStatus.NOT_FOUND;
    }

    /**
     * Obtiene el código HTTP asociado a la excepción.
     *
     * @return el estado HTTP 404.
     */
    public HttpStatus getStatus() {
        return status;
    }
}
