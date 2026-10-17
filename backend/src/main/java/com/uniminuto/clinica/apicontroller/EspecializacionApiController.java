package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.EspecializacionApi;
import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.models.EspecializacionRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.service.EspecializacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller de especializaciones médicas: recibe la petición y delega en el servicio.
 */
@RestController
public class EspecializacionApiController implements EspecializacionApi {

    /**
     * Servicio de especializaciones.
     */
    @Autowired
    private EspecializacionService especializacionService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<Especializacion>> listarEspecializaciones() {
        return ResponseEntity.ok(especializacionService.listarEspecializaciones());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<Especializacion> consultarEspecializacion(Long id) {
        return ResponseEntity.ok(especializacionService.consultarEspecializacion(id));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> guardarEspecializacion(EspecializacionRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(especializacionService.guardarEspecializacion(rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizarEspecializacion(Long id, EspecializacionRq rq) {
        return ResponseEntity.ok(especializacionService.actualizarEspecializacion(id, rq));
    }
}
