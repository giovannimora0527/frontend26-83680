package com.uniminuto.clinica.models;

import com.uniminuto.clinica.entity.Menu;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Respuesta del login: token Bearer, usuario y menús de su perfil.
 */
public record SesionRs(String token, LocalDateTime expiracion, UsuarioRs usuario, List<Menu> menus) {
}
