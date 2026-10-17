package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.RazaApi;
import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.RazaRq;
import com.uniminuto.clinica.service.RazaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller de razas: recibe la petición y delega en el servicio.
 */
@RestController
public class RazaApiController implements RazaApi {

    /**
     * Servicio de razas.
     */
    @Autowired
    private RazaService razaService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<Raza>> listarRazas() {
        return ResponseEntity.ok(razaService.listarRazas());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<Raza> consultarRaza(Integer razaId) {
        return ResponseEntity.ok(razaService.consultarRaza(razaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> guardarRaza(RazaRq razaRq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(razaService.guardarRaza(razaRq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizarRaza(Integer razaId, RazaRq razaRq) {
        return ResponseEntity.ok(razaService.actualizarRaza(razaId, razaRq));
    }
}
