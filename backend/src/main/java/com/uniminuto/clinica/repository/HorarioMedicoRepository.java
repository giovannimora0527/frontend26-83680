package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.HorarioMedico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de horarios de disponibilidad de los veterinarios.
 */
@Repository
public interface HorarioMedicoRepository extends JpaRepository<HorarioMedico, Long> {

    /**
     * Horario semanal de un veterinario, ordenado por día y hora.
     *
     * @param medicoId veterinario.
     * @return franjas.
     */
    List<HorarioMedico> findByMedico_IdOrderByDiaSemanaAscHoraInicioAsc(Long medicoId);

    /**
     * Franjas vigentes de un veterinario en un día de la semana.
     *
     * @param medicoId   veterinario.
     * @param diaSemana  1 = lunes ... 7 = domingo.
     * @return franjas del día.
     */
    List<HorarioMedico> findByMedico_IdAndDiaSemanaAndActivoTrue(Long medicoId, Integer diaSemana);

    /**
     * Borra el horario de un veterinario (se reemplaza completo).
     *
     * @param medicoId veterinario.
     */
    @Modifying
    @Query("delete from HorarioMedico h where h.medico.id = :medicoId")
    void borrarDelMedico(@Param("medicoId") Long medicoId);
}
