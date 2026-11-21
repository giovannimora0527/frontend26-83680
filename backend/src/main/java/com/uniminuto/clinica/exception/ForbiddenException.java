package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/**
 * El perfil del usuario no tiene permiso (403).
 */
public class ForbiddenException extends ApiException {

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}
