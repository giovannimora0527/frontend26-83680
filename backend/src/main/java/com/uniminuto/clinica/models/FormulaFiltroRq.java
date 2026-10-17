package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;

/**
 * Parámetros del listado de fórmulas: página, orden y filtros.
 */
@Data
public class FormulaFiltroRq {

    /**
     * Página solicitada (empieza en 0).
     */
    private int page = 0;

    /**
     * Registros por página.
     */
    private int size = 10;

    /**
     * Columna de orden: creacion, emision, mascota, cliente, medicamento, medico o estado.
     */
    private String orden;

    /**
     * Dirección: asc o desc.
     */
    private String direccion;

    /**
     * Texto libre (mascota, cliente, veterinario, medicamento).
     */
    private String texto;

    /**
     * Estado (ACTIVA o INACTIVA).
     */
    private String estado;

    /**
     * Veterinario.
     */
    private Long medicoId;

    /**
     * Medicamento.
     */
    private Long medicamentoId;

    /**
     * Mascota.
     */
    private Integer mascotaId;

    /**
     * Historia clínica.
     */
    private Long historiaId;

    /**
     * Fecha de emisión inicial (incluida).
     */
    private LocalDate desde;

    /**
     * Fecha de emisión final (incluida).
     */
    private LocalDate hasta;
}
