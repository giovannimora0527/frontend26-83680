package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.ServicioTarifaLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio del log de tarifas.
 */
@Repository
public interface ServicioTarifaLogRepository extends JpaRepository<ServicioTarifaLog, Long> {

    /**
     * Cambios de un servicio, del más reciente al más antiguo.
     *
     * @param servicioId servicio.
     * @return cambios.
     */
    List<ServicioTarifaLog> findByServicio_ServicioIdOrderByFechaDescLogIdDesc(Long servicioId);
}
