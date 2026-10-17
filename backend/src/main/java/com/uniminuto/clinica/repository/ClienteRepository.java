package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos de los clientes.
 */
@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    /**
     * Indica si ya existe un cliente con el mismo documento.
     *
     * @param tipoDocumento   tipo de documento.
     * @param numeroDocumento número de documento.
     * @return true si existe.
     */
    boolean existsByTipoDocumentoAndNumeroDocumento(String tipoDocumento, String numeroDocumento);

    /**
     * Indica si otro cliente (distinto del indicado) ya tiene el mismo documento.
     *
     * @param tipoDocumento   tipo de documento.
     * @param numeroDocumento número de documento.
     * @param clienteId       cliente que se está editando.
     * @return true si existe.
     */
    boolean existsByTipoDocumentoAndNumeroDocumentoAndClienteIdNot(
            String tipoDocumento, String numeroDocumento, Long clienteId);
}
