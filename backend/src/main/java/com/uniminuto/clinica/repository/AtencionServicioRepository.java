package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.AtencionServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de los servicios prestados en cada atención.
 */
@Repository
public interface AtencionServicioRepository extends JpaRepository<AtencionServicio, Long> {

    /**
     * Servicios de una atención en el orden en que se registraron.
     *
     * @param historiaId atención.
     * @return servicios.
     */
    List<AtencionServicio> findByHistoria_HistoriaIdOrderByAtencionServicioIdAsc(Long historiaId);

    /**
     * Indica si el servicio ya está en la atención.
     *
     * @param historiaId atención.
     * @param servicioId servicio.
     * @return true si existe.
     */
    boolean existsByHistoria_HistoriaIdAndServicio_ServicioId(Long historiaId, Long servicioId);
}
