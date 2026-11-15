package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.CitaHistorial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio del historial de cambios de las citas.
 */
@Repository
public interface CitaHistorialRepository extends JpaRepository<CitaHistorial, Long> {

    /**
     * Historial de una cita, del más antiguo al más reciente.
     *
     * @param citaId cita.
     * @return cambios registrados.
     */
    List<CitaHistorial> findByCita_CitaIdOrderByFechaAscHistorialIdAsc(Long citaId);
}
