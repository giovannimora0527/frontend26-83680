package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.ClienteApi;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.models.ClienteRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiereRol({Roles.ADMIN, Roles.RECEPCION})
public class ClienteApiController implements ClienteApi {

    @Autowired
    private ClienteService clienteService;

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
    public ResponseEntity<List<Cliente>> listarClientes() {
        return ResponseEntity.ok(clienteService.listarClientes());
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
    public ResponseEntity<Cliente> consultar(Long clienteId) {
        return ResponseEntity.ok(clienteService.consultar(clienteId));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
    public ResponseEntity<Cliente> buscarClientesPorDocumento(String documento) {
        return ResponseEntity.ok(clienteService.buscarClientesPorDocumento(documento));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> guardar(ClienteRq rq) {
        return ResponseEntity.status(201).body(clienteService.guardar(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> actualizar(ClienteRq rq) {
        return ResponseEntity.ok(clienteService.actualizar(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> cambiarEstado(Long clienteId, boolean activo) {
        return ResponseEntity.ok(clienteService.cambiarEstado(clienteId, activo));
    }
}
