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
 * Perfil de acceso de los usuarios. El código identifica los permisos en el
 * backend; el nombre es solo lo que se muestra.
 */
@Entity
@Table(name = "perfil")
@Data
public class Perfil {

    /**
     * Identificador del perfil.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "perfil_id")
    private Integer perfilId;

    /**
     * Código estable: ADMIN, VETERINARIO, RECEPCIONISTA o DESPACHO_MEDICO.
     */
    @Column(name = "codigo", nullable = false, length = 20, unique = true)
    private String codigo;

    /**
     * Nombre visible del perfil.
     */
    @Column(name = "nombre", nullable = false, length = 50, unique = true)
    private String nombre;

    /**
     * Indica si sus usuarios pueden iniciar sesión.
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
