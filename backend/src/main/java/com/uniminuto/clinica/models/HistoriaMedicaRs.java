package com.uniminuto.clinica.models;

import com.uniminuto.clinica.entity.AnotacionHistoria;
import com.uniminuto.clinica.entity.HistoriaMedica;

import java.util.List;

/**
 * Historia clínica de una consulta con sus anotaciones (evolución).
 */
public record HistoriaMedicaRs(HistoriaMedica historia, List<AnotacionHistoria> anotaciones) {
}
