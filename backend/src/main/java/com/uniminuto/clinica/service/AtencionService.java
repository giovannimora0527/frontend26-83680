package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.AtencionRs;
import com.uniminuto.clinica.models.HistoriaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.ServicioRq;

public interface AtencionService {

    AtencionRs consultar(Long citaId);

    MiRespuestaRS iniciar(Long citaId);

    MiRespuestaRS guardarHistoria(HistoriaRq rq);

    MiRespuestaRS agregarServicio(ServicioRq rq);

    MiRespuestaRS quitarServicio(Long servicioId);

    /** Cierra la historia y marca la cita como ATENDIDA. */
    MiRespuestaRS finalizar(Long citaId);
}
