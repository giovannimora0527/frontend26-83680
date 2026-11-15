package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.ReporteDefRs;
import com.uniminuto.clinica.models.ReporteFiltroRq;
import com.uniminuto.clinica.models.ReporteRs;

import java.util.List;

/**
 * Reportes administrativos, contables, de inventario y de gestión médica.
 */
public interface ReporteService {

    /**
     * Reportes que puede generar el usuario de la sesión según su perfil.
     *
     * @return catálogo de reportes.
     */
    List<ReporteDefRs> catalogo();

    /**
     * Genera un reporte (vista previa, PDF o Excel usan el mismo resultado).
     *
     * @param codigo código del reporte.
     * @param filtro filtros.
     * @return resultado con columnas, filas y totales.
     */
    ReporteRs generar(String codigo, ReporteFiltroRq filtro);

    /**
     * Reporte en PDF.
     *
     * @param codigo código.
     * @param filtro filtros.
     * @return contenido del PDF.
     */
    byte[] pdf(String codigo, ReporteFiltroRq filtro);

    /**
     * Reporte en Excel.
     *
     * @param codigo código.
     * @param filtro filtros.
     * @return contenido del .xlsx.
     */
    byte[] excel(String codigo, ReporteFiltroRq filtro);
}
