package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Menu;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PerfilMenusRq;
import com.uniminuto.clinica.models.PerfilRs;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "02. Usuarios y perfiles", description = "Perfiles y menús asignados (perfil ADMIN)")
@RequestMapping("/perfil")
public interface PerfilApi {

    @Operation(summary = "Lista los perfiles con sus usuarios activos y menús asignados")
    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<PerfilRs>> listar();

    @Operation(summary = "Lista todos los menús del sistema (activos e inactivos)")
    @GetMapping(value = "/menus", produces = "application/json")
    ResponseEntity<List<Menu>> menus();

    @Operation(summary = "Reemplaza los menús asignados a un perfil")
    @PutMapping(value = "/menus", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> asignarMenus(@RequestBody PerfilMenusRq rq);

    @Operation(summary = "Activa o inactiva un perfil (el Administrador no se puede inactivar)")
    @PatchMapping(value = "/cambiar-estado", produces = "application/json")
    ResponseEntity<MiRespuestaRS> cambiarEstado(@RequestParam Integer perfilId, @RequestParam boolean activo);

    @Operation(summary = "Activa o inactiva un menú para todos los perfiles")
    @PatchMapping(value = "/menu/cambiar-estado", produces = "application/json")
    ResponseEntity<MiRespuestaRS> cambiarEstadoMenu(@RequestParam Integer menuId, @RequestParam boolean activo);
}
