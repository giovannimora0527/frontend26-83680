package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.HorarioMedico;
import com.uniminuto.clinica.entity.Medico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HorarioMedicoRepository extends JpaRepository<HorarioMedico, Long> {
    List<HorarioMedico> findByMedicoOrderByDiaSemanaAscHoraInicioAsc(Medico medico);

    List<HorarioMedico> findByMedicoAndDiaSemanaAndActivoTrue(Medico medico, Integer diaSemana);

    void deleteByMedico(Medico medico);
}
