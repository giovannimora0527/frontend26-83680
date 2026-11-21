package com.uniminuto.clinica.security;

import com.uniminuto.clinica.exception.UnauthorizedException;

/**
 * Guarda el usuario autenticado durante la petición (un hilo por petición).
 */
public final class ContextoUsuario {

    private static final ThreadLocal<UsuarioActual> ACTUAL = new ThreadLocal<>();

    private ContextoUsuario() {
    }

    public static void establecer(UsuarioActual usuario) {
        ACTUAL.set(usuario);
    }

    public static UsuarioActual obtener() {
        UsuarioActual u = ACTUAL.get();
        if (u == null) {
            throw new UnauthorizedException("Debe iniciar sesión.");
        }
        return u;
    }

    public static void limpiar() {
        ACTUAL.remove();
    }
}
