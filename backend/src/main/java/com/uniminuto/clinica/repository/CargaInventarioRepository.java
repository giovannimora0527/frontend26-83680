package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.CargaInventario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositorio de las cargas masivas de inventario.
 */
@Repository
public interface CargaInventarioRepository extends JpaRepository<CargaInventario, Long> {

    /**
     * Cargas de la más reciente a la más antigua.
     *
     * @param pageable página.
     * @return cargas.
     */
    Page<CargaInventario> findAllByOrderByFechaDescCargaIdDesc(Pageable pageable);
}
