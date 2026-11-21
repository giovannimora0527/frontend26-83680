package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Perfil;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.UsuarioRq;
import com.uniminuto.clinica.models.UsuarioRs;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "02. Usuarios y perfiles", description = "Administración de usuarios (perfil ADMIN)")
@RequestMapping("/usuario")
public interface UsuarioApi {

    @Operation(summary = "Lista los usuarios")
    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<UsuarioRs>> listar();

    @Operation(summary = "Lista los perfiles (roles) del sistema")
    @GetMapping(value = "/perfiles", produces = "application/json")
    ResponseEntity<List<Perfil>> perfiles();

    @Operation(summary = "Crea un usuario. Perfil MEDICO exige medicoId")
    @PostMapping(value = "/guardar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> guardar(@RequestBody UsuarioRq rq);

    @Operation(summary = "Actualiza un usuario (password opcional)")
    @PutMapping(value = "/actualizar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> actualizar(@RequestBody UsuarioRq rq);

    @Operation(summary = "Activa o inactiva un usuario")
    @PatchMapping(value = "/cambiar-estado", produces = "application/json")
    ResponseEntity<MiRespuestaRS> cambiarEstado(@RequestParam Integer usuarioId, @RequestParam boolean activo);
}
