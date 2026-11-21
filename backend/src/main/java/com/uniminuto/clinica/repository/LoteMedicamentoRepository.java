package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.LoteMedicamento;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoteMedicamentoRepository extends JpaRepository<LoteMedicamento, Long> {

    List<LoteMedicamento> findByMedicamento_IdOrderByFechaVencimientoAscIdAsc(Long medicamentoId);

    /** Lotes con existencia; los que no vencen (NULL) van al final. */
    @Query("""
            SELECT l FROM LoteMedicamento l
            WHERE l.medicamento.id = :medicamentoId AND l.activo = true AND l.cantidadDisponible > 0
            ORDER BY CASE WHEN l.fechaVencimiento IS NULL THEN 1 ELSE 0 END, l.fechaVencimiento, l.id
            """)
    List<LoteMedicamento> conExistenciaFefo(@Param("medicamentoId") Long medicamentoId);

    @Query("SELECT l FROM LoteMedicamento l WHERE l.activo = true AND l.cantidadDisponible > 0")
    List<LoteMedicamento> todosConExistencia();

    boolean existsByMedicamento_IdAndNumeroLoteIgnoreCase(Long medicamentoId, String numeroLote);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM LoteMedicamento l WHERE l.id = :id")
    Optional<LoteMedicamento> bloquear(@Param("id") Long id);
}
