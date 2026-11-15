package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Datos de un servicio y su tarifa.
 */
@Data
public class ServicioRq {

    /** Código único (letras, números y guiones, 3 a 20). */
    private String codigo;

    /** Nombre visible. */
    private String nombre;

    /** Descripción (opcional). */
    private String descripcion;

    /** CONSULTA, PROCEDIMIENTO, LABORATORIO u OTRO. */
    private String tipo;

    /** Especialidad (obligatoria para consultas; opcional en lo demás). */
    private Long especializacionId;

    /** Valor antes de impuestos. */
    private BigDecimal valor;

    /** Porcentaje de IVA (0 a 100). */
    private BigDecimal ivaPorcentaje;

    /** Motivo del cambio de tarifa (queda en el log). */
    private String observacion;
}
