package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Movimiento del historial de entradas y salidas de un producto.
 */
@Data
public class MovimientoRs {

    /**
     * Identificador del movimiento.
     */
    private Long movimientoId;

    /**
     * Fecha y hora del movimiento.
     */
    private LocalDateTime fecha;

    /**
     * Tipo de movimiento.
     */
    private String tipo;

    /**
     * Número del lote afectado.
     */
    private String numeroLote;

    /**
     * Unidades movidas.
     */
    private Integer cantidad;

    /**
     * Existencia del lote después del movimiento.
     */
    private Integer saldoLote;

    /**
     * Usuario responsable.
     */
    private String usuario;

    /**
     * Referencia del origen del movimiento.
     */
    private String referencia;

    /**
     * Observación o motivo.
     */
    private String observacion;

    /**
     * Fórmula médica relacionada, si la hay.
     */
    private Long formulaId;

    /**
     * Entrega (despacho) relacionada, si la hay.
     */
    private Long despachoId;
}
