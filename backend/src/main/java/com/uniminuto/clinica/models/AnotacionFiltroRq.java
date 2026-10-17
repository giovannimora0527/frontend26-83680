package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Parámetros del listado de anotaciones de una historia.
 */
@Data
public class AnotacionFiltroRq {

    /**
     * Historia clínica de la que se listan las anotaciones (obligatoria).
     */
    private Long historiaId;

    /**
     * Página solicitada (empieza en 0).
     */
    private int page = 0;

    /**
     * Registros por página.
     */
    private int size = 10;

    /**
     * Columna de orden: fecha o medico.
     */
    private String orden;

    /**
     * Dirección del orden: asc o desc (por defecto desc).
     */
    private String direccion;

    /**
     * Texto libre a buscar en la anotación o el autor.
     */
    private String texto;
}
