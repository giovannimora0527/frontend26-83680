package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Impuesto;
import com.uniminuto.clinica.entity.Tarifa;
import com.uniminuto.clinica.entity.TarifaHistorial;
import com.uniminuto.clinica.models.ImpuestoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.TarifaRq;

import java.util.List;

public interface TarifaService {
    List<Tarifa> listarTarifas(boolean soloActivas);

    Tarifa consultar(Long id);

    MiRespuestaRS crearTarifa(TarifaRq rq);

    MiRespuestaRS actualizarTarifa(TarifaRq rq);

    MiRespuestaRS cambiarEstadoTarifa(Long id, boolean activo);

    List<TarifaHistorial> historial(Long tarifaId);

    List<Impuesto> listarImpuestos();

    MiRespuestaRS crearImpuesto(ImpuestoRq rq);

    MiRespuestaRS actualizarImpuesto(ImpuestoRq rq);

    MiRespuestaRS cambiarEstadoImpuesto(Long id, boolean activo);
}
