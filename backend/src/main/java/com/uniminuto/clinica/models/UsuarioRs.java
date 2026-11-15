package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Usuario tal como se envía al frontend: sin contraseña ni hash.
 */
@Data
public class UsuarioRs {

    /**
     * Identificador del usuario.
     */
    private Integer id;

    /**
     * Nombre de usuario.
     */
    private String username;

    /**
     * Correo electrónico.
     */
    private String email;

    /**
     * Código del perfil, usado como rol.
     */
    private String rol;

    /**
     * Identificador del perfil.
     */
    private Integer perfilId;

    /**
     * Nombre visible del perfil.
     */
    private String perfilNombre;

    /**
     * Indica si puede iniciar sesión.
     */
    private Boolean activo;

    /**
     * Fecha y hora de creación.
     */
    private LocalDateTime fechaCreacion;
}
