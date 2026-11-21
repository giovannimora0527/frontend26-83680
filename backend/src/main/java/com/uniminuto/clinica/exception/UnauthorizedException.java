package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/**
 * Sesión ausente, inválida o vencida (401).
 */
public class UnauthorizedException extends ApiException {

    public UnauthorizedException(String message) {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}
