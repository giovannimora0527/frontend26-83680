package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;

/**
 * Parámetros del historial de despachos.
 */
@Data
public class DespachoFiltroRq {

    /**
     * Página solicitada (empieza en 0).
     */
    private int page = 0;

    /**
     * Registros por página.
     */
    private int size = 10;

    /**
     * Texto libre: número de fórmula o despacho, mascota, propietario o medicamento.
     */
    private String texto;

    /**
     * Estado de la entrega: CONFIRMADO o REVERTIDO.
     */
    private String estado;

    /**
     * Medicamento entregado.
     */
    private Long medicamentoId;

    /**
     * Fecha inicial (incluida).
     */
    private LocalDate desde;

    /**
     * Fecha final (incluida).
     */
    private LocalDate hasta;
}
