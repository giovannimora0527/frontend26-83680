package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.UsuarioApi;
import com.uniminuto.clinica.entity.Perfil;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.UsuarioRq;
import com.uniminuto.clinica.models.UsuarioRs;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiereRol(Roles.ADMIN)
public class UsuarioApiController implements UsuarioApi {

    @Autowired
    private UsuarioService usuarioService;

    @Override
    public ResponseEntity<List<UsuarioRs>> listar() {
        return ResponseEntity.ok(usuarioService.listar());
    }

    @Override
    public ResponseEntity<List<Perfil>> perfiles() {
        return ResponseEntity.ok(usuarioService.listarPerfiles());
    }

    @Override
    public ResponseEntity<MiRespuestaRS> guardar(UsuarioRq rq) {
        return ResponseEntity.status(201).body(usuarioService.guardar(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> actualizar(UsuarioRq rq) {
        return ResponseEntity.ok(usuarioService.actualizar(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> cambiarEstado(Integer usuarioId, boolean activo) {
        return ResponseEntity.ok(usuarioService.cambiarEstado(usuarioId, activo));
    }
}
