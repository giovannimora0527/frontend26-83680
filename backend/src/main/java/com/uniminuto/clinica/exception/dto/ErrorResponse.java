package com.uniminuto.clinica.exception.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Estructura de la respuesta de error que devuelve el GlobalExceptionHandler.
 */
@Data
public class ErrorResponse {

    private int status;
    private String error;
    private String message;
    private LocalDateTime timestamp = LocalDateTime.now();

    public ErrorResponse(int status, String error, String message) {
        this.status = status;
        this.error = error;
        this.message = message;
    }
}
