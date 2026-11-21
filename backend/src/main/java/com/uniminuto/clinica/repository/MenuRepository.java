package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Integer> {

    @Query(value = """
            SELECT m.* FROM menu m
            INNER JOIN perfil_menu pm ON pm.menu_id = m.menu_id
            WHERE pm.perfil_id = :perfilId AND m.activo = 1
            ORDER BY m.orden, m.title
            """, nativeQuery = true)
    List<Menu> findByPerfil(@Param("perfilId") Integer perfilId);

    List<Menu> findAllByOrderByOrdenAscTitleAsc();

    /** Ids de los menús asignados al perfil, activos o no. */
    @Query(value = "SELECT pm.menu_id FROM perfil_menu pm WHERE pm.perfil_id = :perfilId", nativeQuery = true)
    List<Integer> findIdsByPerfil(@Param("perfilId") Integer perfilId);

    @Modifying
    @Query(value = "DELETE FROM perfil_menu WHERE perfil_id = :perfilId", nativeQuery = true)
    void quitarMenus(@Param("perfilId") Integer perfilId);

    @Modifying
    @Query(value = "INSERT INTO perfil_menu (perfil_id, menu_id) VALUES (:perfilId, :menuId)", nativeQuery = true)
    void asignarMenu(@Param("perfilId") Integer perfilId, @Param("menuId") Integer menuId);
}
