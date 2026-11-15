package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.LoginRq;
import com.uniminuto.clinica.models.LoginRs;
import com.uniminuto.clinica.models.PerfilRs;

/**
 * Operaciones de autenticación.
 */
public interface AuthService {

    /**
     * Valida las credenciales y genera el token de acceso.
     *
     * @param rq usuario y contraseña.
     * @return token y perfil del usuario.
     */
    LoginRs login(LoginRq rq);

    /**
     * Obtiene el perfil del usuario autenticado en la petición actual.
     *
     * @return perfil del usuario.
     */
    PerfilRs perfilActual();
}
