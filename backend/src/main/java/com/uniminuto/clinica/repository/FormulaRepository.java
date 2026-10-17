package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.FormulaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos de las fórmulas médicas.
 */
@Repository
public interface FormulaRepository extends JpaRepository<FormulaMedica, Long>,
        JpaSpecificationExecutor<FormulaMedica> {
}
