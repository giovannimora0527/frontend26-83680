package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.FacturaDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;

@Repository
public interface FacturaDetalleRepository extends JpaRepository<FacturaDetalle, Long> {

    /** ¿Alguno de estos productos dispensados está en una factura vigente? */
    @Query("SELECT COUNT(fd) FROM FacturaDetalle fd WHERE fd.activo = true AND fd.despachoDetalleId IN :ids")
    long contarFacturados(@Param("ids") Collection<Long> despachoDetalleIds);
}
