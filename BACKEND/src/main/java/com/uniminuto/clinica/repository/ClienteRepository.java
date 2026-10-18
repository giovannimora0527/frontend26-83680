package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos de los clientes.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    /**
     * Lista todos los clientes ordenados alfabéticamente por nombres y apellidos.
     *
     * @return Lista de clientes ordenada.
     */
    List<Cliente> findAllByOrderByNombresAscApellidosAsc();
}
