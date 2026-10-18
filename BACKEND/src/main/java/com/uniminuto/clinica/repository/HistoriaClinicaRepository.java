package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.HistoriaClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos de las historias clínicas, con filtros dinámicos.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Repository
public interface HistoriaClinicaRepository
        extends JpaRepository<HistoriaClinica, Long>, JpaSpecificationExecutor<HistoriaClinica> {

    /**
     * Indica si ya existe una historia clínica para la cita dada (solo se permite una por cita).
     *
     * @param citaId Identificador de la cita.
     * @return {@code true} si ya existe.
     */
    @Query("select count(h) > 0 from HistoriaClinica h where h.cita.id = :citaId")
    boolean existePorCita(@Param("citaId") Long citaId);
}
