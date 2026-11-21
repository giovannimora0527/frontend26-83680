package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.AuthApi;
import com.uniminuto.clinica.models.LoginRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.SesionRs;
import com.uniminuto.clinica.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthApiController implements AuthApi {

    @Autowired
    private AuthService authService;

    @Override
    public ResponseEntity<SesionRs> login(LoginRq rq) {
        return ResponseEntity.ok(authService.login(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> logout(String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            authService.logout(authorization.substring(7).trim());
        }
        return ResponseEntity.ok(MiRespuestaRS.ok("Sesión cerrada."));
    }

    @Override
    public ResponseEntity<SesionRs> sesion() {
        return ResponseEntity.ok(authService.sesionActual());
    }
}
