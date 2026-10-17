package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.EstadoCita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;

/**
 * Acceso a datos de las citas médicas. Hereda {@link JpaSpecificationExecutor}
 * para poder combinar filtros dinámicos con paginación y ordenamiento.
 */
@Repository
public interface CitaRepository extends JpaRepository<Cita, Long>,
        JpaSpecificationExecutor<Cita> {

    /**
     * Cuenta las citas de un veterinario dentro de un rango de fechas,
     * ignorando las que están en un estado dado y una cita en particular.
     *
     * @param medicoId        veterinario a revisar.
     * @param estadoExcluido  estado que no cuenta como ocupado (CANCELADA).
     * @param desde           inicio del rango, inclusive.
     * @param hasta           fin del rango, inclusive.
     * @param citaIdExcluido  cita que se debe ignorar (la que se está editando).
     * @return cantidad de citas que se cruzan con el rango.
     */
    @Query("select count(c) from Cita c "
            + "where c.medico.id = :medicoId "
            + "and c.estado <> :estadoExcluido "
            + "and c.fechaHora between :desde and :hasta "
            + "and c.citaId <> :citaIdExcluido")
    long contarCitasDelMedicoEnRango(
            @Param("medicoId") Long medicoId,
            @Param("estadoExcluido") EstadoCita estadoExcluido,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            @Param("citaIdExcluido") Long citaIdExcluido);

    /**
     * Cuenta las citas de una mascota dentro de un rango de fechas,
     * ignorando las que están en un estado dado y una cita en particular.
     *
     * @param mascotaId       mascota a revisar.
     * @param estadoExcluido  estado que no cuenta como ocupado (CANCELADA).
     * @param desde           inicio del rango, inclusive.
     * @param hasta           fin del rango, inclusive.
     * @param citaIdExcluido  cita que se debe ignorar (la que se está editando).
     * @return cantidad de citas que se cruzan con el rango.
     */
    @Query("select count(c) from Cita c "
            + "where c.mascota.mascotaId = :mascotaId "
            + "and c.estado <> :estadoExcluido "
            + "and c.fechaHora between :desde and :hasta "
            + "and c.citaId <> :citaIdExcluido")
    long contarCitasDeLaMascotaEnRango(
            @Param("mascotaId") Integer mascotaId,
            @Param("estadoExcluido") EstadoCita estadoExcluido,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            @Param("citaIdExcluido") Long citaIdExcluido);

    /**
     * Indica si un cliente tiene citas en alguno de los estados dados a partir
     * de una fecha (para impedir inactivarlo con citas por atender).
     *
     * @param clienteId identificador del cliente.
     * @param estados   estados a considerar.
     * @param desde     fecha y hora desde la que se buscan citas.
     * @return true si tiene al menos una cita.
     */
    boolean existsByMascota_Cliente_ClienteIdAndEstadoInAndFechaHoraAfter(
            Long clienteId, Collection<EstadoCita> estados, LocalDateTime desde);
}
