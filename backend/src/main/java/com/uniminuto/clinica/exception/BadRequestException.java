package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/**
 * Datos de entrada inválidos (400).
 */
public class BadRequestException extends ApiException {

    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
