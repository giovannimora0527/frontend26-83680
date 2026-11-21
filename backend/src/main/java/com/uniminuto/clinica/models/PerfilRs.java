package com.uniminuto.clinica.models;

import java.util.List;

/**
 * Perfil con la cantidad de usuarios activos y los menús que tiene asignados.
 */
public record PerfilRs(Integer perfilId, String codigo, String nombre, Boolean activo,
                       long usuariosActivos, List<Integer> menuIds) {
}
