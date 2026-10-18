package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.exception.ResourceNotFoundException;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Implementación de la lógica de consulta de clientes.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Service
public class ClienteServiceImpl implements ClienteService {

    /** Repositorio de clientes. */
    @Autowired
    private ClienteRepository clienteRepository;

    /** {@inheritDoc} */
    @Override
    public List<Cliente> listarClientes() {
        return clienteRepository.findAllByOrderByNombresAscApellidosAsc();
    }

    /** {@inheritDoc} */
    @Override
    public Cliente obtenerCliente(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("El cliente solicitado no existe."));
    }
}
