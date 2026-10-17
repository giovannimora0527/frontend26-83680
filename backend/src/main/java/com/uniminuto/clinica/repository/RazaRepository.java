package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Raza;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos de las razas.
 */
@Repository
public interface RazaRepository extends JpaRepository<Raza, Integer> {

    /**
     * Indica si ya existe la raza en la especie (sin distinguir mayúsculas).
     *
     * @param nombre  nombre de la raza.
     * @param especie especie.
     * @return true si existe.
     */
    boolean existsByNombreIgnoreCaseAndEspecieIgnoreCase(String nombre, String especie);

    /**
     * Indica si otra raza (distinta de la indicada) ya tiene ese nombre en la especie.
     *
     * @param nombre  nombre de la raza.
     * @param especie especie.
     * @param razaId  raza que se está editando.
     * @return true si existe.
     */
    boolean existsByNombreIgnoreCaseAndEspecieIgnoreCaseAndRazaIdNot(String nombre, String especie, Integer razaId);
}
