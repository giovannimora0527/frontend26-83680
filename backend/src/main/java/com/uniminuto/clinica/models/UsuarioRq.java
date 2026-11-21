package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UsuarioRq {
    private Integer usuarioId;
    private String username;
    /** Obligatoria al crear; opcional al actualizar. */
    private String password;
    private String nombreCompleto;
    private String email;
    private Integer perfilId;
    private Long medicoId;
    private Boolean activo;
}
