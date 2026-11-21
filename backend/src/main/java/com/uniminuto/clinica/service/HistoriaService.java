package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.AnotacionHistoriaRq;
import com.uniminuto.clinica.models.HistoriaMedicaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.util.List;

public interface HistoriaService {

    List<HistoriaMedicaRs> listar(boolean soloPropias);

    List<HistoriaMedicaRs> porMascota(Integer mascotaId);

    HistoriaMedicaRs consultar(Long historiaId);

    MiRespuestaRS agregarAnotacion(AnotacionHistoriaRq rq);
}
