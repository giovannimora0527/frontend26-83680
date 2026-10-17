package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción lanzada cuando la operación es válida en su formato pero choca con
 * el estado actual de los datos: horario ocupado, cita ya atendida o cancelada,
 * transición de estado no permitida, etc.
 * El {@link GlobalExceptionHandler} la traduce a una respuesta HTTP 409.
 */
public class ConflictException extends RuntimeException {

    /**
     * Código HTTP asociado a la excepción.
     */
    private final HttpStatus status;

    /**
     * Crea la excepción con el mensaje que verá el usuario.
     *
     * @param message mensaje que explica por qué no se puede realizar la operación.
     */
    public ConflictException(String message) {
        super(message);
        this.status = HttpStatus.CONFLICT;
    }

    /**
     * Obtiene el código HTTP asociado a la excepción.
     *
     * @return el estado HTTP 409.
     */
    public HttpStatus getStatus() {
        return status;
    }
}
