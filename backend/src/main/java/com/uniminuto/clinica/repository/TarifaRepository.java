package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Tarifa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TarifaRepository extends JpaRepository<Tarifa, Long> {
    boolean existsByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, Long id);

    List<Tarifa> findAllByOrderByTipoServicioAscNombreAsc();

    List<Tarifa> findByActivoTrueOrderByTipoServicioAscNombreAsc();
}
