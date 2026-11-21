package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;

/**
 * Filtros comunes de los reportes (cada reporte usa los que le aplican).
 */
@Data
public class ReporteFiltro {
    private LocalDate fechaInicial;
    private LocalDate fechaFinal;
    /** DIA, MES o ANIO. */
    private String agrupacion;
    private String estado;
    private Long medicoId;
    private Long medicamentoId;
    /** ENTRADA / SALIDA para movimientos; tipo de servicio para ingresos por servicio. */
    private String tipo;
    /** Días para "próximos a vencer". */
    private Integer dias;
}
