package com.uniminuto.clinica.util;

import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.NoAutenticadoException;
import com.uniminuto.clinica.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Obtiene el usuario autenticado en la petición actual, para registrar quién
 * realiza cada operación.
 */
@Component
public class UsuarioActual {

    /**
     * Repositorio de usuarios.
     */
    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Devuelve el usuario autenticado.
     *
     * @return el usuario.
     */
    public Usuario obtener() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new NoAutenticadoException("Su sesión no es válida"));
    }
}
