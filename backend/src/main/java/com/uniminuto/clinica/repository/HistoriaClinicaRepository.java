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
