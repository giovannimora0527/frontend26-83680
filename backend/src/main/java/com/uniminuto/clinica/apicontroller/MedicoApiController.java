package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.MedicoApi;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.models.MedicoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.service.MedicoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller de veterinarios: recibe la petición y delega en el servicio.
 */
@RestController
public class MedicoApiController implements MedicoApi {

    /**
     * Servicio de veterinarios.
     */
    @Autowired
    private MedicoService medicoService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<Medico>> listarMedicos() {
        return ResponseEntity.ok(medicoService.listarMedicos());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<Medico> consultarMedico(Long id) {
        return ResponseEntity.ok(medicoService.consultarMedico(id));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> guardarMedico(MedicoRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicoService.guardarMedico(rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizarMedico(Long id, MedicoRq rq) {
        return ResponseEntity.ok(medicoService.actualizarMedico(id, rq));
    }
}
