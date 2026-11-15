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
     * Columna de orden: creacion, emision, numero, mascota, cliente, medico, estado o despacho.
     */
    private String orden;

    /**
     * Dirección: asc o desc.
     */
    private String direccion;

    /**
     * Texto libre: número de fórmula, mascota, cliente, veterinario o medicamento.
     */
    private String texto;

    /**
     * Estado de la fórmula.
     */
    private String estado;

    /**
     * Estado del despacho.
     */
    private String estadoDespacho;

    /**
     * true para listar solo fórmulas confirmadas con medicamentos por entregar.
     */
    private boolean pendientesDespacho;

    /**
     * Veterinario.
     */
    private Long medicoId;

    /**
     * Medicamento formulado.
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
