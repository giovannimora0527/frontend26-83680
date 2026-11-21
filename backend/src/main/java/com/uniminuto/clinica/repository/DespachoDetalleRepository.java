package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.DespachoDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DespachoDetalleRepository extends JpaRepository<DespachoDetalle, Long> {

    /** Productos dispensados (no revertidos) de la cita que aún no están en una factura vigente. */
    @Query("""
            SELECT dd FROM DespachoDetalle dd
            WHERE dd.despacho.formula.cita.id = :citaId
              AND dd.despacho.revertido = false
              AND NOT EXISTS (SELECT fd.id FROM FacturaDetalle fd
                              WHERE fd.despachoDetalleId = dd.id AND fd.activo = true)
            ORDER BY dd.id
            """)
    List<DespachoDetalle> facturablesPorCita(@Param("citaId") Long citaId);

    @Query("""
            SELECT dd FROM DespachoDetalle dd
            WHERE dd.medicamento.id = :medicamentoId
            ORDER BY dd.despacho.fechaDespacho DESC
            """)
    List<DespachoDetalle> porMedicamento(@Param("medicamentoId") Long medicamentoId);
}
