package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.RazaRq;

import java.util.List;

public interface RazaService {
    List<Raza> listarRazas();

    MiRespuestaRS guardarRaza(RazaRq rq);

    MiRespuestaRS actualizarRaza(RazaRq rq);
}
