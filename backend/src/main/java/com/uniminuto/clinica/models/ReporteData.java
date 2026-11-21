package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Resultado tabular de un reporte: se muestra como vista previa (JSON) y se
 * exporta a PDF o Excel con el mismo contenido.
 */
@Data
public class ReporteData {
    private String codigo;
    private String titulo;
    private String subtitulo;
    private List<String> columnas = new ArrayList<>();
    /** TEXTO, ENTERO, MONEDA, FECHA, FECHA_HORA, DECIMAL por columna. */
    private List<String> tipos = new ArrayList<>();
    private List<List<Object>> filas = new ArrayList<>();
    /** Fila de totales alineada con las columnas (null donde no aplica). */
    private List<Object> totales;
    private LocalDateTime generado = LocalDateTime.now();
    private String generadoPor;

    public ReporteData columna(String nombre, String tipo) {
        columnas.add(nombre);
        tipos.add(tipo);
        return this;
    }
}
