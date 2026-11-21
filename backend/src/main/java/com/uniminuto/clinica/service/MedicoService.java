package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.HorarioMedico;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.models.HorarioRq;
import com.uniminuto.clinica.models.MedicoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.time.LocalDateTime;
import java.util.List;

public interface MedicoService {
    List<Medico> listarMedicos(boolean soloActivos);

    Medico consultar(Long medicoId);

    List<Medico> listarMedicosDisponiblesPorFecha(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    MiRespuestaRS guardarMedico(MedicoRq rq);

    MiRespuestaRS actualizarMedico(MedicoRq rq);

    MiRespuestaRS cambiarEstado(Long medicoId, boolean activo);

    List<HorarioMedico> listarHorarios(Long medicoId);

    MiRespuestaRS guardarHorarios(HorarioRq rq);
}
