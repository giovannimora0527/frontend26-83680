package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.TarifaHistorial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TarifaHistorialRepository extends JpaRepository<TarifaHistorial, Long> {
    List<TarifaHistorial> findAllByOrderByFechaDesc();

    List<TarifaHistorial> findByTarifa_IdOrderByFechaDesc(Long tarifaId);
}
