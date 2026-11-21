package com.uniminuto.clinica.security;

/**
 * Datos del usuario autenticado en la petición en curso.
 */
public record UsuarioActual(Integer usuarioId,
                            String username,
                            String nombreCompleto,
                            String perfilCodigo,
                            String perfilNombre,
                            Long medicoId) {

    public boolean tienePerfil(String... perfiles) {
        for (String p : perfiles) {
            if (p.equals(perfilCodigo)) {
                return true;
            }
        }
        return false;
    }
}
