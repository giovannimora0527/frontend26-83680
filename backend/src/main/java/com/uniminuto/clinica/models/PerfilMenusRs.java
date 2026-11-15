package com.uniminuto.clinica.models;

import lombok.Data;

import java.util.List;

/**
 * Perfil con las opciones de menú que tiene asignadas.
 */
@Data
public class PerfilMenusRs {

    /**
     * Identificador del perfil.
     */
    private Integer perfilId;

    /**
     * Código del perfil.
     */
    private String codigo;

    /**
     * Nombre visible.
     */
    private String nombre;

    /**
     * Indica si el perfil está activo.
     */
    private Boolean activo;

    /**
     * Cantidad de usuarios con este perfil.
     */
    private long totalUsuarios;

    /**
     * Identificadores de las opciones asignadas.
     */
    private List<Integer> menuIds;
}
