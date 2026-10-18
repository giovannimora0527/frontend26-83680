package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.AnotacionHistoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos de las anotaciones de historia clínica, con filtros dinámicos.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@Repository
public interface AnotacionHistoriaRepository
        extends JpaRepository<AnotacionHistoria, Long>, JpaSpecificationExecutor<AnotacionHistoria> {
}
