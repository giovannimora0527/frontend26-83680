package com.uniminuto.clinica.dto;

import java.time.LocalDateTime;

/** Respuesta uniforme para informar errores sin exponer detalles internos del sistema. */
public record ApiErrorDTO(LocalDateTime timestamp, int status, String error,
        String message, String path) { }
