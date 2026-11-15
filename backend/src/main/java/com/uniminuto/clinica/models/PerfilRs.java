package com.uniminuto.clinica.models;

import lombok.Data;

import java.util.List;

/**
 * Datos del usuario autenticado que usa el frontend para armar su menú.
 */
@Data
public class PerfilRs {

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
     * Rol de acceso.
     */
    private String rol;

    /**
     * Nombre visible del perfil.
     */
    private String perfilNombre;

    /**
     * Opciones de menú activas del perfil.
     */
    private List<MenuRs> menus;

    /**
     * Veterinario enlazado al usuario, si lo tiene.
     */
    private Long medicoId;

    /**
     * Nombre completo del veterinario enlazado.
     */
    private String medicoNombre;
}
