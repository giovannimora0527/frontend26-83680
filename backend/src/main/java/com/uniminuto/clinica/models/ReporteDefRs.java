package com.uniminuto.clinica.models;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

/**
 * Reporte disponible para el usuario: código, nombre, categoría y filtros que admite.
 */
@Data
@AllArgsConstructor
public class ReporteDefRs {

    /** Código. */
    private String codigo;

    /** Nombre. */
    private String nombre;

    /** Categoría. */
    private String categoria;

    /** Descripción. */
    private String descripcion;

    /** Filtros que admite: fechas, agrupacion, medico, especialidad, medicamento, estadoFactura, estadoCita, dias. */
    private List<String> filtros;
}
