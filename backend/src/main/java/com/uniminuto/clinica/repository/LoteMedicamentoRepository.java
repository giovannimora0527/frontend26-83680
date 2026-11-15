package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.LoteMedicamento;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Acceso a datos de los lotes de inventario.
 */
@Repository
public interface LoteMedicamentoRepository extends JpaRepository<LoteMedicamento, Long> {

    /**
     * Lista todos los lotes con su producto en una sola consulta.
     *
     * @return lotes.
     */
    @Query("select l from LoteMedicamento l join fetch l.medicamento")
    List<LoteMedicamento> listarTodos();

    /**
     * Lista los lotes de un producto.
     *
     * @param medicamentoId identificador del producto.
     * @return lotes del producto.
     */
    List<LoteMedicamento> findByMedicamento_Id(Long medicamentoId);

    /**
     * Lista los lotes de varios productos.
     *
     * @param medicamentoIds identificadores de los productos.
     * @return lotes de esos productos.
     */
    List<LoteMedicamento> findByMedicamento_IdIn(Collection<Long> medicamentoIds);

    /**
     * Indica si el producto ya tiene un lote con ese número.
     *
     * @param medicamentoId identificador del producto.
     * @param numeroLote    número de lote.
     * @return true si existe.
     */
    boolean existsByMedicamento_IdAndNumeroLoteIgnoreCase(Long medicamentoId, String numeroLote);

    /**
     * Obtiene un lote bloqueándolo hasta terminar la transacción, para que dos
     * operaciones simultáneas no descuenten la misma existencia.
     *
     * @param loteId identificador del lote.
     * @return el lote, si existe.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select l from LoteMedicamento l where l.loteId = :loteId")
    Optional<LoteMedicamento> buscarParaActualizar(@Param("loteId") Long loteId);
}
