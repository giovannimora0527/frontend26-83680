package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Resultado de un reporte: columnas, filas y totales, igual para la vista
 * previa, el PDF y el Excel.
 */
@Data
public class ReporteRs {

    /** Código del reporte. */
    private String codigo;

    /** Título. */
    private String titulo;

    /** Categoría (Financiero, Inventario, Gestión médica). */
    private String categoria;

    /** Descripción de los filtros aplicados (para el encabezado). */
    private String filtrosAplicados;

    /** Fecha y hora de generación. */
    private LocalDateTime generado;

    /** Usuario que lo generó. */
    private String usuario;

    /** Columnas. */
    private List<Columna> columnas;

    /** Filas (clave de columna → valor). */
    private List<Map<String, Object>> filas;

    /** Totales por columna (solo las numéricas que se suman). */
    private Map<String, Object> totales;

    /** Indicadores resumidos (etiqueta → valor), por ejemplo valor del inventario. */
    private Map<String, Object> resumen;

    /**
     * Columna de un reporte.
     */
    @Data
    public static class Columna {

        /** Clave en cada fila. */
        private String clave;

        /** Título visible. */
        private String titulo;

        /** TEXTO, ENTERO, MONEDA, PORCENTAJE, FECHA o FECHA_HORA. */
        private String tipo;

        /**
         * @param clave  clave.
         * @param titulo título.
         * @param tipo   tipo.
         */
        public Columna(String clave, String titulo, String tipo) {
            this.clave = clave;
            this.titulo = titulo;
            this.tipo = tipo;
        }
    }
}
