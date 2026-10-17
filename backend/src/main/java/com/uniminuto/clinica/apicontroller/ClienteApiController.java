package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.ClienteApi;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.models.ClienteRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller de clientes: recibe la petición y delega en el servicio.
 */
@RestController
public class ClienteApiController implements ClienteApi {

    /**
     * Servicio de clientes.
     */
    @Autowired
    private ClienteService clienteService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<Cliente>> listarClientes(boolean soloActivos) {
        return ResponseEntity.ok(clienteService.listarClientes(soloActivos));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<Cliente> consultarCliente(Long clienteId) {
        return ResponseEntity.ok(clienteService.consultarCliente(clienteId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> guardarCliente(ClienteRq clienteRq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.guardarCliente(clienteRq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizarCliente(Long clienteId, ClienteRq clienteRq) {
        return ResponseEntity.ok(clienteService.actualizarCliente(clienteId, clienteRq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> activarCliente(Long clienteId) {
        return ResponseEntity.ok(clienteService.cambiarEstado(clienteId, true));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> inactivarCliente(Long clienteId) {
        return ResponseEntity.ok(clienteService.cambiarEstado(clienteId, false));
    }
}
