package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Despacho;
import com.uniminuto.clinica.entity.FormulaEstadoHistorial;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.models.DespachoRq;
import com.uniminuto.clinica.models.DispensacionRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PreparacionRs;

import java.time.LocalDate;
import java.util.List;

public interface DespachoService {

    /** Fórmulas pendientes de despacho con búsqueda por número, propietario, mascota, fecha o estado. */
    List<FormulaMedica> bandeja(String numero, String propietario, String mascota, LocalDate fecha, String estado);

    PreparacionRs preparar(Long formulaId);

    MiRespuestaRS confirmar(DespachoRq rq);

    MiRespuestaRS marcarPendienteDisponibilidad(Long formulaId, String observacion);

    MiRespuestaRS cancelar(Long formulaId, String motivo);

    MiRespuestaRS revertir(Long despachoId, String motivo);

    Despacho consultar(Long despachoId);

    List<Despacho> historial(LocalDate fechaInicial, LocalDate fechaFinal, String texto);

    List<Despacho> despachosDeFormula(Long formulaId);

    List<FormulaEstadoHistorial> historialEstados(Long formulaId);

    List<DispensacionRs> dispensacionesPorMedicamento(Long medicamentoId);
}
