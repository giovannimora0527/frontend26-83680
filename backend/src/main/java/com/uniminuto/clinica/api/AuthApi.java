package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.LoginRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.SesionRs;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;

@Tag(name = "01. Autenticación", description = "Inicio y cierre de sesión, menús por perfil")
@RequestMapping("/auth")
public interface AuthApi {

    @Operation(summary = "Inicia sesión y devuelve el token Bearer y los menús del perfil (público)")
    @PostMapping(value = "/login", produces = "application/json", consumes = "application/json")
    ResponseEntity<SesionRs> login(@RequestBody LoginRq rq);

    @Operation(summary = "Cierra la sesión actual (invalida el token)")
    @PostMapping(value = "/logout", produces = "application/json")
    ResponseEntity<MiRespuestaRS> logout(@RequestHeader(value = "Authorization", required = false) String authorization);

    @Operation(summary = "Usuario autenticado y menús de su perfil")
    @GetMapping(value = "/sesion", produces = "application/json")
    ResponseEntity<SesionRs> sesion();
}
