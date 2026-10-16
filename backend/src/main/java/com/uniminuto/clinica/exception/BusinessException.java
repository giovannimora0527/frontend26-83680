package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/** Excepción de negocio que transporta un código HTTP comprensible para el consumidor de la API. */
public class BusinessException extends RuntimeException {
    private final HttpStatus status;

    /** Construye una excepción de negocio. */
    public BusinessException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    /** Devuelve el estado HTTP que debe incluir la respuesta. */
    public HttpStatus getStatus() { return status; }
}
