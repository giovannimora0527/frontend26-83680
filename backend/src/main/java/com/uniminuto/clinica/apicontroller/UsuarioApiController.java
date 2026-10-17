package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.UsuarioApi;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.UsuarioRq;
import com.uniminuto.clinica.models.UsuarioRs;
import com.uniminuto.clinica.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller de usuarios: recibe la petición y delega en el servicio.
 */
@RestController
public class UsuarioApiController implements UsuarioApi {

    /**
     * Servicio de usuarios.
     */
    @Autowired
    private UsuarioService usuarioService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<UsuarioRs>> listarUsuarios() {
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<UsuarioRs> consultarUsuario(Integer id) {
        return ResponseEntity.ok(usuarioService.consultarUsuario(id));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> guardarUsuario(UsuarioRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.guardarUsuario(rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizarUsuario(Integer id, UsuarioRq rq) {
        return ResponseEntity.ok(usuarioService.actualizarUsuario(id, rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> activarUsuario(Integer id) {
        return ResponseEntity.ok(usuarioService.cambiarEstado(id, true));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> inactivarUsuario(Integer id) {
        return ResponseEntity.ok(usuarioService.cambiarEstado(id, false));
    }
}
