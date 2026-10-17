package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.UsuarioRq;
import com.uniminuto.clinica.models.UsuarioRs;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

/**
 * Servicios REST de usuarios del sistema: GET para consultar, POST para crear
 * y PUT para editar, activar o inactivar. Las respuestas nunca incluyen la
 * contraseña ni su hash.
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/usuario")
public interface UsuarioApi {

    /**
     * Lista los usuarios ordenados por nombre de usuario.
     *
     * @return lista de usuarios.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<List<UsuarioRs>> listarUsuarios();

    /**
     * Consulta un usuario.
     *
     * @param id identificador.
     * @return el usuario (404 si no existe).
     */
    @GetMapping(value = "/{id}", produces = {"application/json"})
    ResponseEntity<UsuarioRs> consultarUsuario(@PathVariable Integer id);

    /**
     * Registra un usuario (queda activo).
     *
     * @param rq datos del usuario, con contraseña.
     * @return mensaje de éxito con estado 201.
     */
    @PostMapping(value = "/guardar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarUsuario(@RequestBody UsuarioRq rq);

    /**
     * Modifica un usuario activo; la contraseña solo cambia si se envía.
     *
     * @param id identificador.
     * @param rq nuevos datos.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizarUsuario(@PathVariable Integer id, @RequestBody UsuarioRq rq);

    /**
     * Activa un usuario.
     *
     * @param id identificador.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}/activar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> activarUsuario(@PathVariable Integer id);

    /**
     * Inactiva un usuario (no se permite dejar el sistema sin administradores).
     *
     * @param id identificador.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}/inactivar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> inactivarUsuario(@PathVariable Integer id);
}
