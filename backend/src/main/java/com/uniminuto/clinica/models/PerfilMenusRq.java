package com.uniminuto.clinica.models;

import lombok.Data;

import java.util.List;

/**
 * Solicitud para definir las opciones de menú de un perfil.
 */
@Data
public class PerfilMenusRq {

    /**
     * Identificadores de las opciones que tendrá el perfil.
     */
    private List<Integer> menuIds;
}
