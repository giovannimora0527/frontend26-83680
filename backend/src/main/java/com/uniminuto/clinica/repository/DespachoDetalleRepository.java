package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.DespachoDetalle;
import com.uniminuto.clinica.entity.EstadoEntrega;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos de las unidades entregadas por lote.
 */
@Repository
public interface DespachoDetalleRepository extends JpaRepository<DespachoDetalle, Long> {

    /**
     * Suma las unidades entregadas por línea de una fórmula, contando solo las
     * entregas en el estado indicado (las revertidas no cuentan).
     *
     * @param formulaId identificador de la fórmula.
     * @param estado    estado de las entregas a sumar.
     * @return pares [identificador de la línea, unidades entregadas].
     */
    @Query("select d.formulaDetalle.detalleId, sum(d.cantidad) from DespachoDetalle d "
            + "where d.despacho.formula.formulaId = :formulaId and d.despacho.estado = :estado "
            + "group by d.formulaDetalle.detalleId")
    List<Object[]> sumarEntregadas(@Param("formulaId") Long formulaId, @Param("estado") EstadoEntrega estado);

    /**
     * Unidades efectivamente dispensadas por medicamento en las fórmulas de una atención
     * (entregas confirmadas, sin las revertidas). Es lo que se factura.
     *
     * @param historiaId atención.
     * @param estado     CONFIRMADO.
     * @return filas [medicamentoId, unidades].
     */
    @Query("select d.formulaDetalle.medicamento.id, sum(d.cantidad) from DespachoDetalle d "
            + "where d.despacho.formula.historia.historiaId = :historiaId and d.despacho.estado = :estado "
            + "and d.despacho.formula.estado = com.uniminuto.clinica.entity.EstadoFormula.CONFIRMADA "
            + "group by d.formulaDetalle.medicamento.id")
    List<Object[]> sumarDispensadoPorAtencion(@Param("historiaId") Long historiaId,
                                              @Param("estado") EstadoEntrega estado);
}
