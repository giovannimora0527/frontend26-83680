package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByUsernameAndUsuarioIdNot(String username, Integer usuarioId);

    boolean existsByMedico_Id(Long medicoId);

    boolean existsByMedico_IdAndUsuarioIdNot(Long medicoId, Integer usuarioId);

    List<Usuario> findAllByOrderByNombreCompletoAsc();

    long countByPerfil_PerfilIdAndActivoTrue(Integer perfilId);
}
