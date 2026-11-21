package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.EstadoCita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstadoCitaRepository extends JpaRepository<EstadoCita, String> {
    List<EstadoCita> findAllByOrderByOrdenAsc();
}
