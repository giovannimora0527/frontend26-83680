package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.MenuRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PerfilMenusRq;
import com.uniminuto.clinica.models.PerfilMenusRs;

import java.util.List;

/**
 * Operaciones de administración de perfiles y menús.
 */
public interface PerfilService {

    /**
     * Lista los perfiles con sus opciones asignadas.
     *
     * @return perfiles.
     */
    List<PerfilMenusRs> listarPerfiles();

    /**
     * Lista todas las opciones de menú.
     *
     * @return opciones ordenadas por título.
     */
    List<MenuRs> listarMenus();

    /**
     * Define las opciones de menú de un perfil.
     *
     * @param perfilId identificador del perfil.
     * @param rq       opciones que tendrá.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizarMenus(Integer perfilId, PerfilMenusRq rq);

    /**
     * Activa o inactiva un perfil.
     *
     * @param perfilId identificador del perfil.
     * @param activar  true para activar, false para inactivar.
     * @return mensaje de éxito.
     */
    MiRespuestaRS cambiarEstadoPerfil(Integer perfilId, boolean activar);

    /**
     * Activa o inactiva una opción de menú.
     *
     * @param menuId  identificador de la opción.
     * @param activar true para activar, false para inactivar.
     * @return mensaje de éxito.
     */
    MiRespuestaRS cambiarEstadoMenu(Integer menuId, boolean activar);
}
