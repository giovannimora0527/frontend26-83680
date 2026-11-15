package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de pagos.
 */
@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    /**
     * Pagos de una factura en orden de registro.
     *
     * @param facturaId factura.
     * @return pagos.
     */
    List<Pago> findByFactura_FacturaIdOrderByFechaAscPagoIdAsc(Long facturaId);
}
