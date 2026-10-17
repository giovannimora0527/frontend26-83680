package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos de los usuarios del sistema.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    /**
     * Indica si otro usuario (distinto del indicado) ya usa el nombre de usuario.
     *
     * @param username nombre de usuario (sin distinguir mayúsculas).
     * @param id       usuario que se edita (-1 al crear).
     * @return true si existe.
     */
    boolean existsByUsernameIgnoreCaseAndIdNot(String username, Integer id);

    /**
     * Indica si otro usuario (distinto del indicado) ya usa el correo.
     *
     * @param email correo (sin distinguir mayúsculas).
     * @param id    usuario que se edita (-1 al crear).
     * @return true si existe.
     */
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Integer id);

    /**
     * Cuenta los usuarios activos con un rol.
     *
     * @param rol    rol.
     * @param activo estado.
     * @return cantidad.
     */
    long countByRolAndActivo(String rol, Boolean activo);
}
