package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Cliente;

import java.util.List;

/**
 * Contrato de la lógica de negocio de los clientes.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
public interface ClienteService {

    /**
     * Lista todos los clientes ordenados por nombre.
     *
     * @return Lista de clientes.
     */
    List<Cliente> listarClientes();

    /**
     * Consulta un cliente por su identificador.
     *
     * @param id Identificador del cliente.
     * @return El cliente encontrado.
     */
    Cliente obtenerCliente(Long id);
}
