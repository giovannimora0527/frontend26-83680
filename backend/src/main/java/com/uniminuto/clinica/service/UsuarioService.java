package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.UsuarioRq;
import com.uniminuto.clinica.models.UsuarioRs;

import java.util.List;

/**
 * Operaciones de negocio de los usuarios del sistema.
 */
public interface UsuarioService {

    /**
     * Lista los usuarios ordenados por nombre de usuario.
     *
     * @return lista de usuarios (sin contraseñas).
     */
    List<UsuarioRs> listarUsuarios();

    /**
     * Consulta un usuario.
     *
     * @param id identificador.
     * @return el usuario (sin contraseña).
     */
    UsuarioRs consultarUsuario(Integer id);

    /**
     * Registra un usuario con nombre y correo únicos y contraseña segura.
     *
     * @param rq datos del usuario.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardarUsuario(UsuarioRq rq);

    /**
     * Modifica un usuario activo; la contraseña solo cambia si se envía.
     *
     * @param id identificador.
     * @param rq nuevos datos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizarUsuario(Integer id, UsuarioRq rq);

    /**
     * Activa o inactiva un usuario.
     *
     * @param id      identificador.
     * @param activar true para activar, false para inactivar.
     * @return mensaje de éxito.
     */
    MiRespuestaRS cambiarEstado(Integer id, boolean activar);
}
