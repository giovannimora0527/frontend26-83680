package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Factura;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio de facturas.
 */
@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long>, JpaSpecificationExecutor<Factura> {

    /**
     * Factura vigente (no anulada) de una atención.
     *
     * @param historiaId atención.
     * @param estado     ANULADA (se excluye).
     * @return la factura, si existe.
     */
    Optional<Factura> findFirstByHistoria_HistoriaIdAndEstadoNot(Long historiaId,
                                                                 com.uniminuto.clinica.entity.EstadoFactura estado);

    /**
     * Obtiene una factura bloqueándola hasta terminar la transacción (pagos y anulación).
     *
     * @param facturaId factura.
     * @return la factura, si existe.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from Factura f where f.facturaId = :facturaId")
    Optional<Factura> buscarParaActualizar(@Param("facturaId") Long facturaId);
}
