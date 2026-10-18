package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Cliente;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

/**
 * Contrato REST de consulta de clientes.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/cliente")
public interface ClienteApi {

    /**
     * Lista los clientes.
     *
     * @return Lista de clientes ordenada por nombre.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<List<Cliente>> listarClientes();

    /**
     * Consulta un cliente.
     *
     * @param id Identificador del cliente.
     * @return El cliente.
     */
    @GetMapping(value = "/obtener/{id}", produces = {"application/json"})
    ResponseEntity<Cliente> obtenerCliente(@PathVariable("id") Long id);
}
