package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.EspecializacionApi;
import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.models.EspecializacionRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.EspecializacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiereRol(Roles.ADMIN)
public class EspecializacionApiController implements EspecializacionApi {

    @Autowired
    private EspecializacionService especializacionService;

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
    public ResponseEntity<List<Especializacion>> listarEspecializaciones(boolean soloActivas) {
        return ResponseEntity.ok(especializacionService.listarEspecializaciones(soloActivas));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> crearEspecializacion(EspecializacionRq rq) {
        return ResponseEntity.status(201).body(especializacionService.crearEspecializacion(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> actualizarEspecializacion(EspecializacionRq rq) {
        return ResponseEntity.ok(especializacionService.actualizarEspecializacion(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> cambiarEstado(Long id, boolean activo) {
        return ResponseEntity.ok(especializacionService.cambiarEstado(id, activo));
    }
}
