package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Impuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImpuestoRepository extends JpaRepository<Impuesto, Long> {
    boolean existsByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, Long id);

    List<Impuesto> findAllByOrderByCodigoAsc();

    Optional<Impuesto> findByCodigoIgnoreCase(String codigo);
}
