package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.models.ClienteRq;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.util.List;

/**
 * Operaciones de negocio de los clientes.
 */
public interface ClienteService {

    /**
     * Lista los clientes ordenados por nombre y apellido.
     *
     * @param soloActivos true para excluir los inactivos.
     * @return lista de clientes.
     */
    List<Cliente> listarClientes(boolean soloActivos);

    /**
     * Consulta un cliente por su identificador.
     *
     * @param clienteId identificador del cliente.
     * @return el cliente encontrado.
     */
    Cliente consultarCliente(Long clienteId);

    /**
     * Registra un cliente validando sus datos y que el documento no esté repetido.
     *
     * @param clienteRq datos del cliente.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardarCliente(ClienteRq clienteRq);

    /**
     * Modifica los datos de un cliente activo.
     *
     * @param clienteId identificador del cliente.
     * @param clienteRq nuevos datos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizarCliente(Long clienteId, ClienteRq clienteRq);

    /**
     * Activa o inactiva un cliente.
     *
     * @param clienteId identificador del cliente.
     * @param activar   true para activar, false para inactivar.
     * @return mensaje de éxito.
     */
    MiRespuestaRS cambiarEstado(Long clienteId, boolean activar);
}
