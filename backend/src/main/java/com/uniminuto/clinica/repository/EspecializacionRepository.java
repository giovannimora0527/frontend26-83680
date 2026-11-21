package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Especializacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EspecializacionRepository extends JpaRepository<Especializacion, Long> {
    boolean existsByCodigoEspecializacionIgnoreCase(String codigo);

    boolean existsByCodigoEspecializacionIgnoreCaseAndIdNot(String codigo, Long id);

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);

    List<Especializacion> findAllByOrderByNombreAsc();

    List<Especializacion> findByActivoTrueOrderByNombreAsc();
}
