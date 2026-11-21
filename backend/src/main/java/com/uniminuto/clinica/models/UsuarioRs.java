package com.uniminuto.clinica.models;

import com.uniminuto.clinica.entity.Usuario;

import java.time.LocalDateTime;

/**
 * Vista pública del usuario (sin hash de contraseña).
 */
public record UsuarioRs(Integer usuarioId, String username, String nombreCompleto, String email,
                        Integer perfilId, String perfilCodigo, String perfilNombre,
                        Long medicoId, String medicoNombre, Boolean activo, LocalDateTime ultimoAcceso) {

    public static UsuarioRs de(Usuario u) {
        return new UsuarioRs(u.getUsuarioId(), u.getUsername(), u.getNombreCompleto(), u.getEmail(),
                u.getPerfil().getPerfilId(), u.getPerfil().getCodigo(), u.getPerfil().getNombre(),
                u.getMedico() == null ? null : u.getMedico().getId(),
                u.getMedico() == null ? null : u.getMedico().nombreCompleto(),
                u.getActivo(), u.getUltimoAcceso());
    }
}
