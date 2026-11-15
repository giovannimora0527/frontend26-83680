package com.uniminuto.clinica.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import com.uniminuto.clinica.models.MenuRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PerfilMenusRq;
import com.uniminuto.clinica.models.PerfilMenusRs;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

/**
 * Servicios REST para administrar perfiles y menús.
 */
@Tag(name = "02. Perfiles y menús", description = "Perfiles de usuario y menús habilitados por perfil")
@RequestMapping("/perfil")
public interface PerfilApi {

    /**
     * Lista los perfiles con sus opciones asignadas.
     *
     * @return perfiles.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<List<PerfilMenusRs>> listarPerfiles();

    /**
     * Lista todas las opciones de menú.
     *
     * @return opciones ordenadas por título.
     */
    @GetMapping(value = "/menus", produces = {"application/json"})
    ResponseEntity<List<MenuRs>> listarMenus();

    /**
     * Define las opciones de menú de un perfil.
     *
     * @param perfilId identificador del perfil.
     * @param rq       opciones que tendrá.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{perfilId}/menus", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizarMenus(@PathVariable Integer perfilId, @RequestBody PerfilMenusRq rq);

    /**
     * Activa un perfil.
     *
     * @param perfilId identificador del perfil.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{perfilId}/activar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> activarPerfil(@PathVariable Integer perfilId);

    /**
     * Inactiva un perfil: sus usuarios dejan de poder ingresar.
     *
     * @param perfilId identificador del perfil.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{perfilId}/inactivar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> inactivarPerfil(@PathVariable Integer perfilId);

    /**
     * Activa una opción de menú.
     *
     * @param menuId identificador de la opción.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/menu/{menuId}/activar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> activarMenu(@PathVariable Integer menuId);

    /**
     * Inactiva una opción de menú: deja de mostrarse a todos los perfiles.
     *
     * @param menuId identificador de la opción.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/menu/{menuId}/inactivar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> inactivarMenu(@PathVariable Integer menuId);
}
