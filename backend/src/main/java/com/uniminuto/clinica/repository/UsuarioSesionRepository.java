package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.UsuarioSesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioSesionRepository extends JpaRepository<UsuarioSesion, String> {

    @Modifying
    @Query("UPDATE UsuarioSesion s SET s.activo = false WHERE s.usuario.usuarioId = :usuarioId AND s.activo = true")
    int cerrarSesionesUsuario(@Param("usuarioId") Integer usuarioId);
}
