package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/**
 * El usuario está autenticado pero no puede operar sobre ese registro
 * (por ejemplo, un veterinario intentando modificar la cita de otro) (HTTP 403).
 */
public class SinPermisoException extends RuntimeException {

    /**
     * Estado HTTP asociado.
     */
    private final HttpStatus status;

    /**
     * @param message explicación para el usuario.
     */
    public SinPermisoException(String message) {
        super(message);
        this.status = HttpStatus.FORBIDDEN;
    }

    /**
     * @return estado HTTP 403.
     */
    public HttpStatus getStatus() {
        return status;
    }
}
