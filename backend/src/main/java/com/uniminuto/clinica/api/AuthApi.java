package com.uniminuto.clinica.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import com.uniminuto.clinica.models.LoginRq;
import com.uniminuto.clinica.models.LoginRs;
import com.uniminuto.clinica.models.PerfilRs;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Servicios REST de autenticación.
 */
@Tag(name = "01. Autenticación", description = "Inicio de sesión con JWT y perfil del usuario")
@RequestMapping("/auth")
public interface AuthApi {

    /**
     * Inicia sesión y entrega el token de acceso.
     *
     * @param rq usuario y contraseña.
     * @return token y perfil (401 si las credenciales no son válidas).
     */
    @PostMapping(value = "/login", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<LoginRs> login(@RequestBody LoginRq rq);

    /**
     * Consulta el perfil del usuario autenticado.
     *
     * @return perfil del usuario.
     */
    @GetMapping(value = "/perfil", produces = {"application/json"})
    ResponseEntity<PerfilRs> perfil();
}
