package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.FormulaEstadoHistorial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos del historial de estados de las fórmulas.
 */
@Repository
public interface FormulaEstadoHistorialRepository extends JpaRepository<FormulaEstadoHistorial, Long> {

    /**
     * Lista los cambios de estado de una fórmula en orden cronológico.
     *
     * @param formulaId identificador de la fórmula.
     * @return cambios de estado.
     */
    List<FormulaEstadoHistorial> findByFormula_FormulaIdOrderByFechaAscHistorialIdAsc(Long formulaId);
}
