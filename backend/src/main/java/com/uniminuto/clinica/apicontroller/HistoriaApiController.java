package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.HistoriaApi;
import com.uniminuto.clinica.models.AnotacionHistoriaRq;
import com.uniminuto.clinica.models.HistoriaMedicaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.HistoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Historias clínicas: MEDICO (lectura y anotaciones) y ADMIN (sólo lectura). */
@RestController
@RequiereRol({Roles.MEDICO, Roles.ADMIN})
public class HistoriaApiController implements HistoriaApi {

    @Autowired
    private HistoriaService historiaService;

    @Override
    public ResponseEntity<List<HistoriaMedicaRs>> listar(boolean soloPropias) {
        return ResponseEntity.ok(historiaService.listar(soloPropias));
    }

    @Override
    public ResponseEntity<List<HistoriaMedicaRs>> porMascota(Integer mascotaId) {
        return ResponseEntity.ok(historiaService.porMascota(mascotaId));
    }

    @Override
    public ResponseEntity<HistoriaMedicaRs> consultar(Long historiaId) {
        return ResponseEntity.ok(historiaService.consultar(historiaId));
    }

    @Override
    @RequiereRol(Roles.MEDICO)
    public ResponseEntity<MiRespuestaRS> agregarAnotacion(AnotacionHistoriaRq rq) {
        return ResponseEntity.status(201).body(historiaService.agregarAnotacion(rq));
    }
}
