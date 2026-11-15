package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;

/**
 * Filtros del listado de facturas.
 */
@Data
public class FacturaFiltroRq {

    /** Página (empieza en 0). */
    private int page = 0;

    /** Registros por página. */
    private int size = 10;

    /** Texto libre (número, propietario, mascota). */
    private String texto;

    /** Estado de pago. */
    private String estado;

    /** Propietario (historial de facturación del propietario). */
    private Long clienteId;

    /** Mascota (historial de facturación de la mascota). */
    private Integer mascotaId;

    /** Fecha inicial. */
    private LocalDate desde;

    /** Fecha final. */
    private LocalDate hasta;
}
