package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.EstadoCitaCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio del catálogo de estados de la cita.
 */
@Repository
public interface EstadoCitaRepository extends JpaRepository<EstadoCitaCatalogo, String> {

    /**
     * Estados en su orden de presentación.
     *
     * @return estados.
     */
    List<EstadoCitaCatalogo> findAllByOrderByOrdenAsc();
}
