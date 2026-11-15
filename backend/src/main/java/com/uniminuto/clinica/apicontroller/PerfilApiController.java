package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.PerfilApi;
import com.uniminuto.clinica.models.MenuRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PerfilMenusRq;
import com.uniminuto.clinica.models.PerfilMenusRs;
import com.uniminuto.clinica.service.PerfilService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller de perfiles y menús: recibe la petición y delega en el servicio.
 */
@RestController
public class PerfilApiController implements PerfilApi {

    /**
     * Servicio de perfiles.
     */
    @Autowired
    private PerfilService perfilService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<PerfilMenusRs>> listarPerfiles() {
        return ResponseEntity.ok(perfilService.listarPerfiles());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<MenuRs>> listarMenus() {
        return ResponseEntity.ok(perfilService.listarMenus());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizarMenus(Integer perfilId, PerfilMenusRq rq) {
        return ResponseEntity.ok(perfilService.actualizarMenus(perfilId, rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> activarPerfil(Integer perfilId) {
        return ResponseEntity.ok(perfilService.cambiarEstadoPerfil(perfilId, true));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> inactivarPerfil(Integer perfilId) {
        return ResponseEntity.ok(perfilService.cambiarEstadoPerfil(perfilId, false));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> activarMenu(Integer menuId) {
        return ResponseEntity.ok(perfilService.cambiarEstadoMenu(menuId, true));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> inactivarMenu(Integer menuId) {
        return ResponseEntity.ok(perfilService.cambiarEstadoMenu(menuId, false));
    }
}
