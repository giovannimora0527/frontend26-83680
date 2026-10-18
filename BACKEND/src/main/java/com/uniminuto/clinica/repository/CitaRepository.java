package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

/**
 * Acceso a datos de las citas. Soporta filtros dinámicos mediante {@link JpaSpecificationExecutor}
 * y consultas de verificación de disponibilidad.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@Repository
public interface CitaRepository extends JpaRepository<Cita, Long>, JpaSpecificationExecutor<Cita> {

    /**
     * Verifica si el veterinario ya tiene una cita activa (no cancelada) dentro del rango dado.
     *
     * @param medicoId  Identificador del veterinario.
     * @param desde     Inicio del rango (inclusive).
     * @param hasta     Fin del rango (inclusive).
     * @param excluirId Id de la cita que se está editando (usar -1 al crear).
     * @return {@code true} si existe un cruce de horario.
     */
    @Query("select count(c) > 0 from Cita c where c.medico.id = :medicoId "
            + "and upper(c.estado) <> 'CANCELADA' "
            + "and c.fechaHora between :desde and :hasta and c.id <> :excluirId")
    boolean existeCruceMedico(@Param("medicoId") Long medicoId,
                              @Param("desde") LocalDateTime desde,
                              @Param("hasta") LocalDateTime hasta,
                              @Param("excluirId") Long excluirId);

    /**
     * Verifica si la mascota ya tiene una cita activa (no cancelada) dentro del rango dado.
     *
     * @param mascotaId Identificador de la mascota.
     * @param desde     Inicio del rango (inclusive).
     * @param hasta     Fin del rango (inclusive).
     * @param excluirId Id de la cita que se está editando (usar -1 al crear).
     * @return {@code true} si la mascota ya tiene una cita simultánea.
     */
    @Query("select count(c) > 0 from Cita c where c.mascota.mascotaId = :mascotaId "
            + "and upper(c.estado) <> 'CANCELADA' "
            + "and c.fechaHora between :desde and :hasta and c.id <> :excluirId")
    boolean existeCruceMascota(@Param("mascotaId") Integer mascotaId,
                               @Param("desde") LocalDateTime desde,
                               @Param("hasta") LocalDateTime hasta,
                               @Param("excluirId") Long excluirId);
}
