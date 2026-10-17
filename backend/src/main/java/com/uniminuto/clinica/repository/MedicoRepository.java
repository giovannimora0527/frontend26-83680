package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Medico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos de los veterinarios.
 */
@Repository
public interface MedicoRepository extends JpaRepository<Medico, Long> {

    /**
     * Indica si otro veterinario (distinto del indicado) ya tiene el documento.
     *
     * @param tipoDocumento   tipo de documento.
     * @param numeroDocumento número de documento.
     * @param id              veterinario que se edita (-1 al crear).
     * @return true si existe.
     */
    boolean existsByTipoDocumentoAndNumeroDocumentoAndIdNot(String tipoDocumento, String numeroDocumento, Long id);

    /**
     * Indica si otro veterinario (distinto del indicado) ya tiene el registro profesional.
     *
     * @param registroProfesional registro (sin distinguir mayúsculas).
     * @param id                  veterinario que se edita (-1 al crear).
     * @return true si existe.
     */
    boolean existsByRegistroProfesionalIgnoreCaseAndIdNot(String registroProfesional, Long id);
}
