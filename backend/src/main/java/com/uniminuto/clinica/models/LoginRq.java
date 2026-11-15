package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Credenciales para iniciar sesión.
 */
@Data
public class LoginRq {

    /**
     * Nombre de usuario.
     */
    private String username;

    /**
     * Contraseña.
     */
    private String password;
}
