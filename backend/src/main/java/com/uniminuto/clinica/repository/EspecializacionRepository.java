package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Especializacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos de las especializaciones médicas.
 */
@Repository
public interface EspecializacionRepository extends JpaRepository<Especializacion, Long> {

    /**
     * Indica si otra especialización (distinta de la indicada) ya usa el nombre.
     *
     * @param nombre nombre a buscar (sin distinguir mayúsculas).
     * @param id     especialización que se edita (-1 al crear).
     * @return true si existe.
     */
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);

    /**
     * Indica si otra especialización (distinta de la indicada) ya usa el código.
     *
     * @param codigo código a buscar (sin distinguir mayúsculas).
     * @param id     especialización que se edita (-1 al crear).
     * @return true si existe.
     */
    boolean existsByCodigoEspecializacionIgnoreCaseAndIdNot(String codigo, Long id);
}
