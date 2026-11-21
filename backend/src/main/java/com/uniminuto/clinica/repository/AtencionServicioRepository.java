package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.AtencionServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AtencionServicioRepository extends JpaRepository<AtencionServicio, Long> {
    List<AtencionServicio> findByCita_IdOrderByIdAsc(Long citaId);

    boolean existsByCita_IdAndTarifa_Id(Long citaId, Long tarifaId);
}
