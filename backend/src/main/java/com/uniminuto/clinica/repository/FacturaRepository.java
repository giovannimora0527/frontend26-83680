package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Factura;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long> {

    List<Factura> findByFechaGeneracionBetweenOrderByFechaGeneracionDesc(LocalDateTime desde, LocalDateTime hasta);

    List<Factura> findByCliente_IdOrderByFechaGeneracionDesc(Long clienteId);

    List<Factura> findByMascota_MascotaIdOrderByFechaGeneracionDesc(Integer mascotaId);

    boolean existsByCita_IdAndEstadoNot(Long citaId, String estado);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM Factura f WHERE f.id = :id")
    Optional<Factura> bloquear(@Param("id") Long id);
}
