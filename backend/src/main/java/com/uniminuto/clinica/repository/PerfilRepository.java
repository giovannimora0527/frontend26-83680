package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Acceso a datos de los perfiles.
 */
@Repository
public interface PerfilRepository extends JpaRepository<Perfil, Integer> {

    /**
     * Busca un perfil por su código.
     *
     * @param codigo código del perfil.
     * @return el perfil, si existe.
     */
    Optional<Perfil> findByCodigo(String codigo);
}
