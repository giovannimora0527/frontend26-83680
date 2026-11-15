package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Acceso a datos de los usuarios del sistema.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    /**
     * Busca un usuario por su nombre, sin distinguir mayúsculas.
     *
     * @param username nombre de usuario.
     * @return el usuario, si existe.
     */
    Optional<Usuario> findByUsernameIgnoreCase(String username);

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
     * Cuenta los usuarios de un perfil según su estado.
     *
     * @param codigo código del perfil.
     * @param activo estado.
     * @return cantidad.
     */
    long countByPerfil_CodigoAndActivo(String codigo, Boolean activo);

    /**
     * Cuenta los usuarios de un perfil.
     *
     * @param perfilId identificador del perfil.
     * @return cantidad.
     */
    long countByPerfil_PerfilId(Integer perfilId);
}
