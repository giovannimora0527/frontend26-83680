package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.CargaInventarioDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de las filas de las cargas masivas.
 */
@Repository
public interface CargaInventarioDetalleRepository extends JpaRepository<CargaInventarioDetalle, Long> {

    /**
     * Filas de una carga en orden.
     *
     * @param cargaId carga.
     * @return filas.
     */
    List<CargaInventarioDetalle> findByCarga_CargaIdOrderByFilaAsc(Long cargaId);
}
