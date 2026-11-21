package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

/**
 * Menús que quedan asignados a un perfil (reemplaza la asignación anterior).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PerfilMenusRq {
    private Integer perfilId;
    private List<Integer> menuIds;
}
