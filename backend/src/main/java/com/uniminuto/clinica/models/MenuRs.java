package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Opción de menú.
 */
@Data
public class MenuRs {

    /**
     * Identificador de la opción.
     */
    private Integer menuId;

    /**
     * Código de la opción.
     */
    private String code;

    /**
     * Título visible.
     */
    private String title;

    /**
     * Ruta de la pantalla.
     */
    private String url;

    /**
     * Clases CSS del icono.
     */
    private String icon;

    /**
     * Indica si la opción se muestra.
     */
    private Boolean activo;
}
