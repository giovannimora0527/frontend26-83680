package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.PerfilApi;
import com.uniminuto.clinica.entity.Menu;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PerfilMenusRq;
import com.uniminuto.clinica.models.PerfilRs;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.PerfilService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiereRol(Roles.ADMIN)
public class PerfilApiController implements PerfilApi {

    @Autowired
    private PerfilService perfilService;

    @Override
    public ResponseEntity<List<PerfilRs>> listar() {
        return ResponseEntity.ok(perfilService.listar());
    }

    @Override
    public ResponseEntity<List<Menu>> menus() {
        return ResponseEntity.ok(perfilService.listarMenus());
    }

    @Override
    public ResponseEntity<MiRespuestaRS> asignarMenus(PerfilMenusRq rq) {
        return ResponseEntity.ok(perfilService.asignarMenus(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> cambiarEstado(Integer perfilId, boolean activo) {
        return ResponseEntity.ok(perfilService.cambiarEstadoPerfil(perfilId, activo));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> cambiarEstadoMenu(Integer menuId, boolean activo) {
        return ResponseEntity.ok(perfilService.cambiarEstadoMenu(menuId, activo));
    }
}
