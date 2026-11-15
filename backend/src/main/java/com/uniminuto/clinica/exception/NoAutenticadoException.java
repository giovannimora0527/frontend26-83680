package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción lanzada cuando las credenciales no son válidas.
 * El {@link GlobalExceptionHandler} la traduce a una respuesta HTTP 401.
 */
public class NoAutenticadoException extends RuntimeException {

    /**
     * Código HTTP asociado a la excepción.
     */
    private final HttpStatus status;

    /**
     * Crea la excepción con el mensaje que verá el usuario.
     *
     * @param message mensaje para el usuario.
     */
    public NoAutenticadoException(String message) {
        super(message);
        this.status = HttpStatus.UNAUTHORIZED;
    }

    /**
     * Obtiene el código HTTP asociado a la excepción.
     *
     * @return el estado HTTP 401.
     */
    public HttpStatus getStatus() {
        return status;
    }
}
