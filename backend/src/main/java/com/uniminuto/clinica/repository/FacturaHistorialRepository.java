package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.FacturaHistorial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacturaHistorialRepository extends JpaRepository<FacturaHistorial, Long> {
    List<FacturaHistorial> findByFacturaIdOrderByFechaAscIdAsc(Long facturaId);
}
