package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.FormulaEstadoHistorial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FormulaEstadoHistorialRepository extends JpaRepository<FormulaEstadoHistorial, Long> {
    List<FormulaEstadoHistorial> findByFormulaIdOrderByFechaAscIdAsc(Long formulaId);
}
