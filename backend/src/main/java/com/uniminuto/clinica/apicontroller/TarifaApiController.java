package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.TarifaApi;
import com.uniminuto.clinica.entity.Impuesto;
import com.uniminuto.clinica.entity.Tarifa;
import com.uniminuto.clinica.entity.TarifaHistorial;
import com.uniminuto.clinica.models.ImpuestoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.TarifaRq;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.TarifaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiereRol(Roles.ADMIN)
public class TarifaApiController implements TarifaApi {

    @Autowired
    private TarifaService tarifaService;

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
    public ResponseEntity<List<Tarifa>> listar(boolean soloActivas) {
        return ResponseEntity.ok(tarifaService.listarTarifas(soloActivas));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
    public ResponseEntity<Tarifa> consultar(Long tarifaId) {
        return ResponseEntity.ok(tarifaService.consultar(tarifaId));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> crear(TarifaRq rq) {
        return ResponseEntity.status(201).body(tarifaService.crearTarifa(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> actualizar(TarifaRq rq) {
        return ResponseEntity.ok(tarifaService.actualizarTarifa(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> cambiarEstado(Long tarifaId, boolean activo) {
        return ResponseEntity.ok(tarifaService.cambiarEstadoTarifa(tarifaId, activo));
    }

    @Override
    public ResponseEntity<List<TarifaHistorial>> historial(Long tarifaId) {
        return ResponseEntity.ok(tarifaService.historial(tarifaId));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
    public ResponseEntity<List<Impuesto>> listarImpuestos() {
        return ResponseEntity.ok(tarifaService.listarImpuestos());
    }

    @Override
    public ResponseEntity<MiRespuestaRS> crearImpuesto(ImpuestoRq rq) {
        return ResponseEntity.status(201).body(tarifaService.crearImpuesto(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> actualizarImpuesto(ImpuestoRq rq) {
        return ResponseEntity.ok(tarifaService.actualizarImpuesto(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> cambiarEstadoImpuesto(Long id, boolean activo) {
        return ResponseEntity.ok(tarifaService.cambiarEstadoImpuesto(id, activo));
    }
}
