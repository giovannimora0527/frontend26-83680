package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.MovimientoInventario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos de los movimientos de inventario.
 */
@Repository
public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {

    /**
     * Consulta una página del historial de un producto.
     *
     * @param medicamentoId identificador del producto.
     * @param pagina        página y orden.
     * @return movimientos del producto.
     */
    @EntityGraph(attributePaths = {"lote", "usuario"})
    Page<MovimientoInventario> findByMedicamento_Id(Long medicamentoId, Pageable pagina);
}
