package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Menu;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PerfilMenusRq;
import com.uniminuto.clinica.models.PerfilRs;

import java.util.List;

public interface PerfilService {

    List<PerfilRs> listar();

    List<Menu> listarMenus();

    MiRespuestaRS asignarMenus(PerfilMenusRq rq);

    MiRespuestaRS cambiarEstadoPerfil(Integer perfilId, boolean activo);

    MiRespuestaRS cambiarEstadoMenu(Integer menuId, boolean activo);
}
