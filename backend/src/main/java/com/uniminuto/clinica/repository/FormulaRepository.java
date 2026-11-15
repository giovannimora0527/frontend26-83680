package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.FormulaMedica;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Acceso a datos de las fórmulas médicas.
 */
@Repository
public interface FormulaRepository extends JpaRepository<FormulaMedica, Long>,
        JpaSpecificationExecutor<FormulaMedica> {

    /**
     * Obtiene una fórmula bloqueándola hasta terminar la transacción, para que
     * dos operaciones de despacho simultáneas no procesen la misma fórmula.
     *
     * @param formulaId identificador de la fórmula.
     * @return la fórmula, si existe.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from FormulaMedica f where f.formulaId = :formulaId")
    Optional<FormulaMedica> buscarParaActualizar(@Param("formulaId") Long formulaId);

    /**
     * Fórmulas de una atención (historia clínica), de la más antigua a la más reciente.
     *
     * @param historiaId atención.
     * @return fórmulas.
     */
    java.util.List<FormulaMedica> findByHistoria_HistoriaIdOrderByFormulaIdAsc(Long historiaId);
}
