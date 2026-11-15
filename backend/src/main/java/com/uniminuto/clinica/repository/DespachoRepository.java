package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Despacho;
import com.uniminuto.clinica.entity.EstadoEntrega;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos de las entregas de medicamentos.
 */
@Repository
public interface DespachoRepository extends JpaRepository<Despacho, Long>, JpaSpecificationExecutor<Despacho> {

    /**
     * Lista las entregas de una fórmula en orden cronológico.
     *
     * @param formulaId identificador de la fórmula.
     * @return entregas.
     */
    List<Despacho> findByFormula_FormulaIdOrderByFechaAsc(Long formulaId);

    /**
     * Indica si una fórmula tiene entregas en un estado.
     *
     * @param formulaId identificador de la fórmula.
     * @param estado    estado de la entrega.
     * @return true si existe alguna.
     */
    boolean existsByFormula_FormulaIdAndEstado(Long formulaId, EstadoEntrega estado);
}
