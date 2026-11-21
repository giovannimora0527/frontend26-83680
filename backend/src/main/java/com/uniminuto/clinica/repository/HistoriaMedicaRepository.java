package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.HistoriaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HistoriaMedicaRepository extends JpaRepository<HistoriaMedica, Long> {
    Optional<HistoriaMedica> findByCita_Id(Long citaId);

    List<HistoriaMedica> findByMascota_MascotaIdOrderByFechaHoraDesc(Integer mascotaId);

    List<HistoriaMedica> findAllByOrderByFechaHoraDesc();

    List<HistoriaMedica> findByMedico_IdOrderByFechaHoraDesc(Long medicoId);
}
