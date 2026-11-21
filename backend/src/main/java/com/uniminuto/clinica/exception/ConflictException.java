package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/**
 * Conflicto con el estado actual o reglas de negocio (409).
 */
public class ConflictException extends ApiException {

    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
