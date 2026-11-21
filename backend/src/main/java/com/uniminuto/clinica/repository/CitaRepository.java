package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Mascota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {

    List<Cita> findAllByOrderByFechaHoraDesc();

    List<Cita> findByFechaHoraBetweenOrderByFechaHoraAsc(LocalDateTime inicio, LocalDateTime fin);

    List<Cita> findByMascotaOrderByFechaHoraDesc(Mascota mascota);

    /** Citas de un veterinario que se cruzan con el rango (para el calendario). */
    @Query("""
            SELECT c FROM Cita c
            WHERE c.medico.id = :medicoId AND c.fechaHora < :fin AND c.fechaHoraFin > :inicio
            ORDER BY c.fechaHora
            """)
    List<Cita> findByMedicoEnRango(@Param("medicoId") Long medicoId,
                                   @Param("inicio") LocalDateTime inicio,
                                   @Param("fin") LocalDateTime fin);

    /** Citas del veterinario que se superponen con [inicio, fin). excluirId = -1 para no excluir. */
    @Query("""
            SELECT c FROM Cita c
            WHERE c.medico.id = :medicoId AND c.estado IN :estados AND c.id <> :excluirId
              AND c.fechaHora < :fin AND c.fechaHoraFin > :inicio
            """)
    List<Cita> traslapesMedico(@Param("medicoId") Long medicoId,
                               @Param("inicio") LocalDateTime inicio,
                               @Param("fin") LocalDateTime fin,
                               @Param("estados") Collection<String> estados,
                               @Param("excluirId") Long excluirId);

    /** Citas de la mascota que se superponen con [inicio, fin). */
    @Query("""
            SELECT c FROM Cita c
            WHERE c.mascota.mascotaId = :mascotaId AND c.estado IN :estados AND c.id <> :excluirId
              AND c.fechaHora < :fin AND c.fechaHoraFin > :inicio
            """)
    List<Cita> traslapesMascota(@Param("mascotaId") Integer mascotaId,
                                @Param("inicio") LocalDateTime inicio,
                                @Param("fin") LocalDateTime fin,
                                @Param("estados") Collection<String> estados,
                                @Param("excluirId") Long excluirId);

    long countByMedico_IdAndEstadoInAndFechaHoraAfter(Long medicoId, Collection<String> estados, LocalDateTime fecha);

    /** Citas atendidas que todavía no tienen una factura vigente. */
    @Query("""
            SELECT c FROM Cita c
            WHERE c.estado = 'ATENDIDA'
              AND NOT EXISTS (SELECT f.id FROM Factura f WHERE f.cita = c AND f.estado <> 'ANULADA')
            ORDER BY c.fechaHora DESC
            """)
    List<Cita> findAtendidasSinFactura();
}
