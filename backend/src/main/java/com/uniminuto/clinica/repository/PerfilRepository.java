package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerfilRepository extends JpaRepository<Perfil, Integer> {
    Optional<Perfil> findByCodigo(String codigo);

    List<Perfil> findAllByOrderByNombreAsc();
}
