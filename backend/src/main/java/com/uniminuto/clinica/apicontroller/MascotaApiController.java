package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.MascotaApi;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.service.MascotaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller de mascotas: recibe la petición y delega en el servicio.
 */
@RestController
public class MascotaApiController implements MascotaApi {

    /**
     * Servicio de mascotas.
     */
    @Autowired
    private MascotaService mascotaService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<Mascota>> listarMascotas() {
        return ResponseEntity.ok(mascotaService.listarMascotas());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<Mascota>> buscarMascotasPorCliente(Long clienteId) {
        return ResponseEntity.ok(mascotaService.listarMascotasPorCliente(clienteId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<Mascota>> buscarMascotasPorRaza(Integer razaId) {
        return ResponseEntity.ok(mascotaService.listarMascotasPorRaza(razaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<Mascota> consultarMascota(Integer mascotaId) {
        return ResponseEntity.ok(mascotaService.consultarMascota(mascotaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> guardarMascota(MascotaRq mascotaRq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mascotaService.guardarMascota(mascotaRq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizarMascota(Integer mascotaId, MascotaRq mascotaRq) {
        return ResponseEntity.ok(mascotaService.actualizarMascota(mascotaId, mascotaRq));
    }
}
