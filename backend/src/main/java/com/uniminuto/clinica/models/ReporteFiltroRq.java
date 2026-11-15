package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;

/**
 * Filtros de un reporte (cada reporte usa los que le aplican).
 */
@Data
public class ReporteFiltroRq {

    /** Fecha inicial (por defecto, el primer día del mes). */
    private LocalDate desde;

    /** Fecha final (por defecto, hoy). */
    private LocalDate hasta;

    /** DIA, MES o ANIO (reportes por período). */
    private String agrupacion;

    /** Veterinario. */
    private Long medicoId;

    /** Especialidad. */
    private Long especializacionId;

    /** Medicamento o producto. */
    private Long medicamentoId;

    /** Estado (de factura o de cita, según el reporte). */
    private String estado;

    /** Días hacia adelante (próximos a vencer; por defecto 60). */
    private Integer dias;
}
