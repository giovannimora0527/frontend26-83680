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
 * Opción del menú de la aplicación.
 */
@Entity
@Table(name = "menu")
@Data
public class Menu {

    /**
     * Identificador de la opción.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_id")
    private Integer menuId;

    /**
     * Código de la opción.
     */
    @Column(name = "code", nullable = false, length = 100, unique = true)
    private String code;

    /**
     * Título visible.
     */
    @Column(name = "title", nullable = false)
    private String title;

    /**
     * Ruta de la pantalla en el frontend.
     */
    @Column(name = "url", nullable = false, unique = true)
    private String url;

    /**
     * Clases CSS del icono.
     */
    @Column(name = "icon", nullable = false)
    private String icon;

    /**
     * Indica si la opción se muestra.
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
