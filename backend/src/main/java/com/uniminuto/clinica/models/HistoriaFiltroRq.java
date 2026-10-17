package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;

/**
 * Parámetros del listado de historias clínicas: paginación, orden y filtros.
 */
@Data
public class HistoriaFiltroRq {

    /**
     * Página solicitada (empieza en 0).
     */
    private int page = 0;

    /**
     * Registros por página.
     */
    private int size = 10;

    /**
     * Columna de orden: fecha, hora, cliente, mascota, medico o diagnostico.
     */
    private String orden;

    /**
     * Dirección del orden: asc o desc (por defecto desc).
     */
    private String direccion;

    /**
     * Texto libre a buscar.
     */
    private String texto;

    /**
     * Estado por el que se filtra (ABIERTA o CERRADA).
     */
    private String estado;

    /**
     * Cliente por el que se filtra.
     */
    private Long clienteId;

    /**
     * Mascota por la que se filtra.
     */
    private Integer mascotaId;

    /**
     * Veterinario por el que se filtra.
     */
    private Long medicoId;

    /**
     * Fecha inicial del rango (incluida).
     */
    private LocalDate desde;

    /**
     * Fecha final del rango (incluida).
     */
    private LocalDate hasta;
}
