package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Respuesta de un inicio de sesión exitoso.
 */
@Data
public class LoginRs {

    /**
     * Token JWT que se envía en cada petición.
     */
    private String token;

    /**
     * Datos del usuario autenticado.
     */
    private PerfilRs perfil;
}
