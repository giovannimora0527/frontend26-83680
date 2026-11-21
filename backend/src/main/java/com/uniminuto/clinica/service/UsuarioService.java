package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Perfil;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.UsuarioRq;
import com.uniminuto.clinica.models.UsuarioRs;

import java.util.List;

public interface UsuarioService {

    List<UsuarioRs> listar();

    List<Perfil> listarPerfiles();

    MiRespuestaRS guardar(UsuarioRq rq);

    MiRespuestaRS actualizar(UsuarioRq rq);

    MiRespuestaRS cambiarEstado(Integer usuarioId, boolean activo);
}
