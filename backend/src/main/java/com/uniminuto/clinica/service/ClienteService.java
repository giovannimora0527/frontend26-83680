package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.models.ClienteRq;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.util.List;

public interface ClienteService {
    List<Cliente> listarClientes();

    Cliente consultar(Long clienteId);

    Cliente buscarClientesPorDocumento(String documento);

    MiRespuestaRS guardar(ClienteRq rq);

    MiRespuestaRS actualizar(ClienteRq rq);

    MiRespuestaRS cambiarEstado(Long clienteId, boolean activo);
}
