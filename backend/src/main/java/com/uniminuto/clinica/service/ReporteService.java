package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.ReporteCatalogoRs;
import com.uniminuto.clinica.models.ReporteData;
import com.uniminuto.clinica.models.ReporteFiltro;

import java.util.List;

public interface ReporteService {

    List<ReporteCatalogoRs> catalogo();

    ReporteData generar(String codigo, ReporteFiltro filtro);
}
