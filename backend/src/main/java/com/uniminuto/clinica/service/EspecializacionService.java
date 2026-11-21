package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.models.EspecializacionRq;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.util.List;

public interface EspecializacionService {
    List<Especializacion> listarEspecializaciones(boolean soloActivas);

    MiRespuestaRS crearEspecializacion(EspecializacionRq rq);

    MiRespuestaRS actualizarEspecializacion(EspecializacionRq rq);

    MiRespuestaRS cambiarEstado(Long id, boolean activo);
}
