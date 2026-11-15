package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.EstadoCita;
import com.uniminuto.clinica.entity.HistoriaClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Acceso a datos de las historias clínicas.
 */
@Repository
public interface HistoriaClinicaRepository extends JpaRepository<HistoriaClinica, Long>,
        JpaSpecificationExecutor<HistoriaClinica> {

    /**
     * Indica si una cita ya tiene una historia clínica asociada.
     *
     * @param citaId identificador de la cita.
     * @return true si ya existe una historia para esa cita.
     */
    boolean existsByCita_CitaId(Long citaId);

    /**
     * Historia (atención) de una cita.
     *
     * @param citaId cita.
     * @return la historia, si existe.
     */
    Optional<HistoriaClinica> findByCita_CitaId(Long citaId);

    /**
     * Antecedentes de una mascota: sus otras historias, de la más reciente a la más antigua.
     *
     * @param mascotaId  mascota.
     * @param historiaId historia actual (se excluye).
     * @return historias anteriores.
     */
    List<HistoriaClinica> findByMascota_MascotaIdAndHistoriaIdNotOrderByFechaHoraDesc(Integer mascotaId, Long historiaId);

    /**
     * Atenciones finalizadas (con cita) que aún no tienen factura.
     *
     * @return historias por facturar, de la más antigua a la más reciente.
     */
    @Query("select h from HistoriaClinica h where h.estado = com.uniminuto.clinica.entity.EstadoHistoria.CERRADA "
            + "and h.cita is not null "
            + "and not exists (select f.facturaId from Factura f where f.historia = h "
            + "and f.estado <> com.uniminuto.clinica.entity.EstadoFactura.ANULADA) order by h.fechaHora")
    List<HistoriaClinica> buscarPorFacturar();

    /**
     * Obtiene una historia bloqueándola hasta terminar la transacción (para no facturarla dos veces).
     *
     * @param historiaId historia.
     * @return la historia, si existe.
     */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select h from HistoriaClinica h where h.historiaId = :historiaId")
    Optional<HistoriaClinica> buscarParaActualizar(@Param("historiaId") Long historiaId);

    /**
     * Atenciones de un veterinario en un estado (por ejemplo, las abiertas).
     *
     * @param medicoId veterinario.
     * @param estado   estado de la historia.
     * @return atenciones con cita, de la más antigua a la más reciente.
     */
    List<HistoriaClinica> findByMedico_IdAndEstadoAndCitaIsNotNullOrderByFechaHoraAsc(
            Long medicoId, com.uniminuto.clinica.entity.EstadoHistoria estado);

    /**
     * Lista las citas atendidas de una mascota que aún no tienen historia,
     * de la más reciente a la más antigua.
     *
     * @param mascotaId mascota de las citas.
     * @param estado    estado requerido (ATENDIDA).
     * @return citas disponibles para generar una historia.
     */
    @Query("select c from Cita c where c.mascota.mascotaId = :mascotaId "
            + "and c.estado = :estado "
            + "and not exists (select h.historiaId from HistoriaClinica h where h.cita = c) "
            + "order by c.fechaHora desc")
    List<Cita> buscarCitasSinHistoria(@Param("mascotaId") Integer mascotaId,
                                      @Param("estado") EstadoCita estado);
}
