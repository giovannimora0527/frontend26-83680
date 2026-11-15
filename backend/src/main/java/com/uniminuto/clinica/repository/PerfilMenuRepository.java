package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Menu;
import com.uniminuto.clinica.entity.PerfilMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos de las asignaciones de menú por perfil.
 */
@Repository
public interface PerfilMenuRepository extends JpaRepository<PerfilMenu, Integer> {

    /**
     * Lista las asignaciones de un perfil.
     *
     * @param perfilId identificador del perfil.
     * @return asignaciones del perfil.
     */
    List<PerfilMenu> findByPerfil_PerfilId(Integer perfilId);

    /**
     * Lista las opciones activas de un perfil, ordenadas por título.
     *
     * @param perfilId identificador del perfil.
     * @return opciones de menú.
     */
    @Query("select pm.menu from PerfilMenu pm where pm.perfil.perfilId = :perfilId "
            + "and pm.menu.activo = true order by pm.menu.title")
    List<Menu> listarMenusActivos(@Param("perfilId") Integer perfilId);
}
