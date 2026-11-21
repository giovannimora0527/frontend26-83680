package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.MascotaApi;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.MascotaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
public class MascotaApiController implements MascotaApi {

    @Autowired
    private MascotaService mascotaService;

    @Override
    public ResponseEntity<List<Mascota>> listarMascotas() {
        return ResponseEntity.ok(mascotaService.listarMascotas());
    }

    @Override
    public ResponseEntity<List<Mascota>> listarMascotasOrdenado(boolean ascendente) {
        return ResponseEntity.ok(mascotaService.listarMascotasOrdenado(ascendente));
    }

    @Override
    public ResponseEntity<List<Mascota>> buscarMascotaPorNombre(String nombre) {
        return ResponseEntity.ok(mascotaService.buscarPorNombre(nombre));
    }

    @Override
    public ResponseEntity<List<Mascota>> buscarMascotaPorCliente(Long clienteId) {
        return ResponseEntity.ok(mascotaService.buscarMascotasPorCliente(clienteId));
    }

    @Override
    public ResponseEntity<List<Mascota>> buscarMascotaPorRaza(Integer razaId) {
        return ResponseEntity.ok(mascotaService.buscarMascotasPorRaza(razaId));
    }

    @Override
    public ResponseEntity<Mascota> consultar(Integer mascotaId) {
        return ResponseEntity.ok(mascotaService.consultar(mascotaId));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION})
    public ResponseEntity<MiRespuestaRS> guardarMascota(MascotaRq rq) {
        return ResponseEntity.status(201).body(mascotaService.guardarMascota(rq));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION})
    public ResponseEntity<MiRespuestaRS> actualizarMascota(MascotaRq rq) {
        return ResponseEntity.ok(mascotaService.actualizarMascota(rq));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION})
    public ResponseEntity<MiRespuestaRS> cambiarEstado(Integer mascotaId, boolean activo) {
        return ResponseEntity.ok(mascotaService.cambiarEstado(mascotaId, activo));
    }
}
