package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.CargaMasivaDetalle;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CargaMasivaDetalleRepository extends JpaRepository<CargaMasivaDetalle, Long> {
    List<CargaMasivaDetalle> findByCargaIdOrderByFilaAsc(Long cargaId);

    long countByCargaIdAndEstado(Long cargaId, String estado);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM CargaMasivaDetalle d WHERE d.id = :id")
    Optional<CargaMasivaDetalle> bloquear(@Param("id") Long id);
}
