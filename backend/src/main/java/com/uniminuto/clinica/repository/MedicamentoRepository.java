package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Medicamento;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicamentoRepository extends JpaRepository<Medicamento, Long> {

    Optional<Medicamento> findByCodigoIgnoreCase(String codigo);

    Optional<Medicamento> findByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);

    List<Medicamento> findAllByOrderByNombreAsc();

    /** Bloquea el medicamento para actualizar su saldo de forma consistente. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Medicamento m WHERE m.id = :id")
    Optional<Medicamento> bloquear(@Param("id") Long id);
}
