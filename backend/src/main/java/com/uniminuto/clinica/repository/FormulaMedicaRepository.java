package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.FormulaMedica;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FormulaMedicaRepository extends JpaRepository<FormulaMedica, Long> {

    List<FormulaMedica> findAllByOrderByFechaCreacionRegistroDesc();

    List<FormulaMedica> findByMedico_IdOrderByFechaCreacionRegistroDesc(Long medicoId);

    List<FormulaMedica> findByCita_IdOrderByIdAsc(Long citaId);

    List<FormulaMedica> findByMascota_MascotaIdAndEstadoOrderByFechaEmisionDesc(Integer mascotaId, String estado);

    List<FormulaMedica> findByEstadoAndEstadoDespachoInOrderByFechaConfirmacionAsc(String estado, Collection<String> estados);

    long countByCita_IdAndEstado(Long citaId, String estado);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM FormulaMedica f WHERE f.id = :id")
    Optional<FormulaMedica> bloquear(@Param("id") Long id);
}
