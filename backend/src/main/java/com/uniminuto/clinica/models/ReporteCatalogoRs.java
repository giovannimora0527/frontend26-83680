package com.uniminuto.clinica.models;

import java.util.List;

/**
 * Reporte disponible y los filtros que admite.
 */
public record ReporteCatalogoRs(String codigo, String titulo, String grupo, List<String> filtros) {
}
