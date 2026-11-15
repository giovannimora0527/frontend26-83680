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
import java.util.List;

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
    /**
     * Cuenta las citas activas del veterinario que se cruzan con el rango
     * [inicio, fin). Dos citas se cruzan si una empieza antes de que la otra termine.
     *
     * @param medicoId       veterinario.
     * @param estadoExcluido estado que no ocupa horario (cancelada).
     * @param inicio         inicio del rango.
     * @param fin            fin del rango.
     * @param citaIdExcluido cita a ignorar (la que se edita).
     * @return número de citas que se cruzan.
     */
    @Query("select count(c) from Cita c where c.medico.id = :medicoId and c.estado <> :estadoExcluido "
            + "and c.fechaHora < :fin and c.fechaHoraFin > :inicio and c.citaId <> :citaIdExcluido")
    long contarCrucesDelMedico(@Param("medicoId") Long medicoId,
                               @Param("estadoExcluido") EstadoCita estadoExcluido,
                               @Param("inicio") LocalDateTime inicio,
                               @Param("fin") LocalDateTime fin,
                               @Param("citaIdExcluido") Long citaIdExcluido);

    /**
     * Cuenta las citas activas de la mascota que se cruzan con el rango [inicio, fin).
     *
     * @param mascotaId      mascota.
     * @param estadoExcluido estado que no ocupa horario (cancelada).
     * @param inicio         inicio del rango.
     * @param fin            fin del rango.
     * @param citaIdExcluido cita a ignorar (la que se edita).
     * @return número de citas que se cruzan.
     */
    @Query("select count(c) from Cita c where c.mascota.mascotaId = :mascotaId and c.estado <> :estadoExcluido "
            + "and c.fechaHora < :fin and c.fechaHoraFin > :inicio and c.citaId <> :citaIdExcluido")
    long contarCrucesDeLaMascota(@Param("mascotaId") Integer mascotaId,
                                 @Param("estadoExcluido") EstadoCita estadoExcluido,
                                 @Param("inicio") LocalDateTime inicio,
                                 @Param("fin") LocalDateTime fin,
                                 @Param("citaIdExcluido") Long citaIdExcluido);

    /**
     * Citas que se cruzan con un rango (calendario), opcionalmente de un veterinario.
     *
     * @param medicoId veterinario (null = todos).
     * @param desde    inicio del rango.
     * @param hasta    fin del rango.
     * @return citas ordenadas por inicio.
     */
    @Query("select c from Cita c join fetch c.mascota m join fetch m.cliente join fetch c.medico "
            + "where (:medicoId is null or c.medico.id = :medicoId) "
            + "and c.fechaHora < :hasta and c.fechaHoraFin > :desde order by c.fechaHora, c.citaId")
    List<Cita> buscarEnRango(@Param("medicoId") Long medicoId,
                             @Param("desde") LocalDateTime desde,
                             @Param("hasta") LocalDateTime hasta);

    /**
     * Cuenta las citas futuras de un veterinario en ciertos estados.
     *
     * @param medicoId veterinario.
     * @param estados  estados a contar.
     * @param desde    momento a partir del cual se cuentan.
     * @return número de citas.
     */
    long countByMedico_IdAndEstadoInAndFechaHoraAfter(Long medicoId, Collection<EstadoCita> estados,
                                                      LocalDateTime desde);
}
