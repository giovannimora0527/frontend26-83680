package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.ServicioApi;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.ServicioRq;
import com.uniminuto.clinica.models.ServicioRs;
import com.uniminuto.clinica.models.TarifaLogRs;
import com.uniminuto.clinica.service.ServicioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller de servicios y tarifas.
 */
@RestController
public class ServicioApiController implements ServicioApi {

    /** Servicio de tarifas. */
    @Autowired
    private ServicioService servicioService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<ServicioRs>> listar(boolean soloActivos) {
        return ResponseEntity.ok(servicioService.listar(soloActivos));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<ServicioRs> consultar(Long id) {
        return ResponseEntity.ok(servicioService.consultar(id));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> guardar(ServicioRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(servicioService.guardar(rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizar(Long id, ServicioRq rq) {
        return ResponseEntity.ok(servicioService.actualizar(id, rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> activar(Long id) {
        return ResponseEntity.ok(servicioService.cambiarActivo(id, true));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> inactivar(Long id) {
        return ResponseEntity.ok(servicioService.cambiarActivo(id, false));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<TarifaLogRs>> historial(Long id) {
        return ResponseEntity.ok(servicioService.historial(id));
    }
}
