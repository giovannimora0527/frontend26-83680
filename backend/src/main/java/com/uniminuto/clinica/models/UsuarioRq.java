package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Solicitud para crear o editar un usuario.
 */
@Data
public class UsuarioRq {

    /**
     * Nombre de usuario (4 a 30 letras, números, punto, guion o guion bajo).
     */
    private String username;

    /**
     * Correo electrónico.
     */
    private String email;

    /**
     * Perfil de acceso.
     */
    private Integer perfilId;

    /**
     * Contraseña: obligatoria al crear; al editar solo se cambia si se envía.
     */
    private String password;
}
