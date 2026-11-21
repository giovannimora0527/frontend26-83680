package com.uniminuto.clinica.models;

import com.uniminuto.clinica.entity.CargaMasiva;

import java.util.List;
import java.util.Map;

/**
 * Vista previa / resultado de una carga masiva.
 */
public record CargaMasivaRs(CargaMasiva carga, List<String> columnas, List<Fila> filas) {

    public record Fila(Long id, Integer fila, String codigo, String nombre, Map<String, String> datos,
                       boolean valido, String estado, List<String> errores, String accion) {
    }
}
