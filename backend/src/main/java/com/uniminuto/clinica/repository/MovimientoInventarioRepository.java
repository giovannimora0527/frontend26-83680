package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.MovimientoInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {

    /** Kardex. medicamentoId = -1 para todos (literal -1L); tipo = '' para ambos. */
    @Query("""
            SELECT m FROM MovimientoInventario m
            WHERE (:medicamentoId = -1L OR m.medicamento.id = :medicamentoId)
              AND (:tipo = '' OR m.tipo = :tipo)
              AND m.fecha >= :desde AND m.fecha < :hasta
            ORDER BY m.fecha DESC, m.id DESC
            """)
    List<MovimientoInventario> buscar(@Param("medicamentoId") Long medicamentoId,
                                      @Param("tipo") String tipo,
                                      @Param("desde") LocalDateTime desde,
                                      @Param("hasta") LocalDateTime hasta);

    List<MovimientoInventario> findByDespachoIdOrderByIdAsc(Long despachoId);
}
