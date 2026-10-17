package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Anotacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos de las anotaciones de historias clínicas.
 */
@Repository
public interface AnotacionRepository extends JpaRepository<Anotacion, Long>,
        JpaSpecificationExecutor<Anotacion> {

    /**
     * Cuenta las anotaciones de una historia.
     *
     * @param historiaId identificador de la historia.
     * @return cantidad de anotaciones.
     */
    long countByHistoria_HistoriaId(Long historiaId);
}
