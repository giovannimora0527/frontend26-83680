package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.FormulaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos de las fórmulas médicas, con filtros dinámicos.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@Repository
public interface FormulaMedicaRepository
        extends JpaRepository<FormulaMedica, Long>, JpaSpecificationExecutor<FormulaMedica> {
}
