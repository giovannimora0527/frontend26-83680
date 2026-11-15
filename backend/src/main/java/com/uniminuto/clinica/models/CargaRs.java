package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Resultado de una carga masiva: resumen y, en el detalle, cada fila con su estado.
 */
@Data
public class CargaRs {

    /** Identificador. */
    private Long cargaId;

    /** Archivo. */
    private String archivo;

    /** XLSX o CSV. */
    private String formato;

    /** Usuario. */
    private String usuario;

    /** Fecha de validación. */
    private LocalDateTime fecha;

    /** VALIDADA, CONFIRMADA o DESCARTADA. */
    private String estado;

    /** Filas leídas. */
    private int totalFilas;

    /** Filas válidas. */
    private int filasValidas;

    /** Filas con error. */
    private int filasError;

    /** Filas importadas. */
    private int filasImportadas;

    /** Fecha de confirmación. */
    private LocalDateTime fechaConfirmacion;

    /** Filas (solo en el detalle). */
    private List<Fila> filas;

    /**
     * Fila del archivo con su resultado.
     */
    @Data
    public static class Fila {
        private Integer fila;
        private String codigo;
        private String nombre;
        private String tipo;
        private String precioVenta;
        private String numeroLote;
        private String cantidad;
        private String fechaVencimiento;
        private String estado;
        private String mensaje;
        private Long medicamentoId;
    }
}
