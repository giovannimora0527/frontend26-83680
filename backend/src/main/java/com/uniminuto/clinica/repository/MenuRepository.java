package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos de las opciones de menú.
 */
@Repository
public interface MenuRepository extends JpaRepository<Menu, Integer> {
}
