package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Usuario del sistema. La contraseña se guarda como hash PBKDF2 y nunca se
 * devuelve al frontend (los servicios responden con UsuarioRs).
 */
@Entity
@Table(name = "usuario")
@Data
public class Usuario {

    /**
     * Identificador del usuario.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    /**
     * Nombre de usuario para iniciar sesión (único).
     */
    @Column(name = "username", nullable = false, length = 30, unique = true)
    private String username;

    /**
     * Correo electrónico (único).
     */
    @Column(name = "email", nullable = false, length = 120, unique = true)
    private String email;

    /**
     * Hash de la contraseña (formato pbkdf2$iteraciones$sal$hash).
     */
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    /**
     * Rol de acceso: ADMIN, VETERINARIO, RECEPCIONISTA o CLIENTE.
     */
    @Column(name = "rol", nullable = false, length = 20)
    private String rol;

    /**
     * Indica si puede iniciar sesión.
     */
    @Column(name = "activo", nullable = false)
    private Boolean activo;

    /**
     * Fecha y hora de creación.
     */
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    /**
     * Fecha y hora de la última modificación.
     */
    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;
}
