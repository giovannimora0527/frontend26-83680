package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.RazaApi;
import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.RazaRq;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.RazaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiereRol({Roles.ADMIN, Roles.RECEPCION})
public class RazaApiController implements RazaApi {

    @Autowired
    private RazaService razaService;

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
    public ResponseEntity<List<Raza>> listarRazas() {
        return ResponseEntity.ok(razaService.listarRazas());
    }

    @Override
    public ResponseEntity<MiRespuestaRS> guardarRaza(RazaRq rq) {
        return ResponseEntity.status(201).body(razaService.guardarRaza(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> actualizarRaza(RazaRq rq) {
        return ResponseEntity.ok(razaService.actualizarRaza(rq));
    }
}
