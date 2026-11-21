package com.uniminuto.clinica.models;

import com.uniminuto.clinica.entity.AtencionServicio;
import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.HistoriaMedica;

import java.util.List;

/**
 * Todo lo que el veterinario necesita en la pantalla de atención.
 */
public record AtencionRs(Cita cita,
                         HistoriaMedica historia,
                         List<AtencionServicio> servicios,
                         List<FormulaMedica> formulas,
                         List<HistoriaMedicaRs> antecedentes) {
}
