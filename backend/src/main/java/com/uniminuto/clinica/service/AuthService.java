package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.models.LoginRq;
import com.uniminuto.clinica.models.SesionRs;
import com.uniminuto.clinica.security.UsuarioActual;

public interface AuthService {

    SesionRs login(LoginRq loginRq);

    void logout(String token);

    SesionRs sesionActual();

    UsuarioActual validarToken(String token);

    /** Entidad del usuario autenticado (para auditoría de operaciones). */
    Usuario usuarioActual();
}
