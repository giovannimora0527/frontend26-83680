package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.FormulaEstadoHistorial;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.util.List;

public interface FormulaService {

    List<FormulaMedica> listar();

    FormulaMedica consultar(Long formulaId);

    List<FormulaMedica> porCita(Long citaId);

    List<FormulaEstadoHistorial> historial(Long formulaId);

    MiRespuestaRS guardar(FormulaRq rq);

    MiRespuestaRS actualizar(FormulaRq rq);

    MiRespuestaRS confirmar(Long formulaId);

    MiRespuestaRS anular(Long formulaId, String motivo);
}
