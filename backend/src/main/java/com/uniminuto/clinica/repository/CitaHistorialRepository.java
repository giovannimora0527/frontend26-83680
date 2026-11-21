package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.CitaHistorial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CitaHistorialRepository extends JpaRepository<CitaHistorial, Long> {
    List<CitaHistorial> findByCita_IdOrderByFechaAscIdAsc(Long citaId);
}
