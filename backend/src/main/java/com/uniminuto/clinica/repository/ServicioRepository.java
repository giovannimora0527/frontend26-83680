package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Servicio;
import com.uniminuto.clinica.entity.TipoServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio de servicios y tarifas.
 */
@Repository
public interface ServicioRepository extends JpaRepository<Servicio, Long> {

    /**
     * Indica si otro servicio usa el código.
     *
     * @param codigo código.
     * @param id     servicio a excluir.
     * @return true si existe.
     */
    boolean existsByCodigoIgnoreCaseAndServicioIdNot(String codigo, Long id);

    /**
     * Indica si otro servicio usa el nombre.
     *
     * @param nombre nombre.
     * @param id     servicio a excluir.
     * @return true si existe.
     */
    boolean existsByNombreIgnoreCaseAndServicioIdNot(String nombre, Long id);

    /**
     * Consulta activa de una especialidad.
     *
     * @param tipo              CONSULTA.
     * @param especializacionId especialidad.
     * @return la consulta, si existe.
     */
    Optional<Servicio> findFirstByTipoAndEspecializacion_IdAndActivoTrue(TipoServicio tipo, Long especializacionId);

    /**
     * Consulta activa general (sin especialidad).
     *
     * @param tipo CONSULTA.
     * @return la consulta general, si existe.
     */
    Optional<Servicio> findFirstByTipoAndEspecializacionIsNullAndActivoTrue(TipoServicio tipo);

    /**
     * Indica si otra consulta activa ya cubre la especialidad.
     *
     * @param tipo              CONSULTA.
     * @param especializacionId especialidad.
     * @param id                servicio a excluir.
     * @return true si existe.
     */
    boolean existsByTipoAndEspecializacion_IdAndActivoTrueAndServicioIdNot(TipoServicio tipo, Long especializacionId,
                                                                          Long id);

    /**
     * Servicios ordenados por tipo y nombre.
     *
     * @return servicios.
     */
    List<Servicio> findAllByOrderByTipoAscNombreAsc();
}
