package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;

/**
 * Parámetros de consulta del listado de citas: paginación, orden y filtros.
 */
@Data
public class CitaFiltroRq {

    /**
     * Número de página que se solicita (empieza en 0).
     */
    private int page = 0;

    /**
     * Cantidad de registros por página.
     */
    private int size = 10;

    /**
     * Columna por la que se ordena: fecha, hora, cliente, mascota, medico o estado.
     */
    private String orden;

    /**
     * Dirección del orden: asc o desc. Por defecto desc.
     */
    private String direccion;

    /**
     * Texto libre que se busca en mascota, cliente, veterinario y motivo.
     */
    private String texto;

    /**
     * Estado de la cita por el que se filtra.
     */
    private String estado;

    /**
     * Veterinario por el que se filtra.
     */
    private Long medicoId;

    /**
     * Cliente por el que se filtra.
     */
    private Long clienteId;

    /**
     * Mascota por la que se filtra.
     */
    private Integer mascotaId;

    /**
     * Fecha inicial del rango (incluida).
     */
    private LocalDate desde;

    /**
     * Fecha final del rango (incluida).
     */
    private LocalDate hasta;
}
