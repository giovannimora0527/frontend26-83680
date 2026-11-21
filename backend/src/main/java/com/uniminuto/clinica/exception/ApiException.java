package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción base de negocio. Cada subclase define el código HTTP que se devuelve.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
