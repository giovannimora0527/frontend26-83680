package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.AuthApi;
import com.uniminuto.clinica.models.LoginRq;
import com.uniminuto.clinica.models.LoginRs;
import com.uniminuto.clinica.models.PerfilRs;
import com.uniminuto.clinica.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller de autenticación: recibe la petición y delega en el servicio.
 */
@RestController
public class AuthApiController implements AuthApi {

    /**
     * Servicio de autenticación.
     */
    @Autowired
    private AuthService authService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<LoginRs> login(LoginRq rq) {
        return ResponseEntity.ok(authService.login(rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<PerfilRs> perfil() {
        return ResponseEntity.ok(authService.perfilActual());
    }
}
