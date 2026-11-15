package com.uniminuto.clinica.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Escribe las respuestas 401 y 403 con el mismo formato que el resto de
 * errores de la API, sin exponer información técnica.
 */
@Component
public class ErroresAccesoHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    /**
     * Petición sin sesión válida (HTTP 401).
     *
     * @param request   petición.
     * @param response  respuesta.
     * @param exception motivo del rechazo.
     * @throws IOException si no se puede escribir la respuesta.
     */
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException exception) throws IOException {
        escribir(response, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED",
                "Su sesión no es válida o expiró. Inicie sesión nuevamente.");
    }

    /**
     * Usuario autenticado sin permiso sobre el servicio (HTTP 403).
     *
     * @param request   petición.
     * @param response  respuesta.
     * @param exception motivo del rechazo.
     * @throws IOException si no se puede escribir la respuesta.
     */
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException exception) throws IOException {
        escribir(response, HttpStatus.FORBIDDEN, "FORBIDDEN",
                "Su perfil no tiene permiso para realizar esta operación.");
    }

    /**
     * Escribe el cuerpo de error en JSON.
     *
     * @param response respuesta.
     * @param estado   código HTTP.
     * @param error    nombre corto del error.
     * @param mensaje  mensaje para el usuario.
     * @throws IOException si no se puede escribir la respuesta.
     */
    private void escribir(HttpServletResponse response, HttpStatus estado, String error, String mensaje)
            throws IOException {
        response.setStatus(estado.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"status\":" + estado.value()
                + ",\"error\":\"" + error + "\",\"message\":\"" + mensaje + "\"}");
    }
}
