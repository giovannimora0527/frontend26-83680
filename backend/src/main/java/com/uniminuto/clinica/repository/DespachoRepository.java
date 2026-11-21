package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Despacho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DespachoRepository extends JpaRepository<Despacho, Long> {

    Optional<Despacho> findByClaveIdempotencia(String clave);

    List<Despacho> findByFechaDespachoBetweenOrderByFechaDespachoDesc(LocalDateTime desde, LocalDateTime hasta);

    List<Despacho> findByFormula_IdOrderByFechaDespachoAsc(Long formulaId);
}
