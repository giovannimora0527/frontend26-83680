package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Medicamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos de los productos del inventario.
 */
@Repository
public interface MedicamentoRepository extends JpaRepository<Medicamento, Long> {

    /**
     * Indica si otro producto (distinto del indicado) ya usa el código.
     *
     * @param codigo código a buscar.
     * @param id     producto que se edita (-1 al crear).
     * @return true si existe.
     */
    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, Long id);

    /**
     * Indica si otro producto (distinto del indicado) ya usa el nombre.
     *
     * @param nombre nombre a buscar.
     * @param id     producto que se edita (-1 al crear).
     * @return true si existe.
     */
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);
}
