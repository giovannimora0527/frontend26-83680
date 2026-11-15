package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Servicio con su tarifa vigente.
 */
@Data
public class ServicioRs {

    /** Identificador. */
    private Long servicioId;

    /** Código. */
    private String codigo;

    /** Nombre. */
    private String nombre;

    /** Descripción. */
    private String descripcion;

    /** Tipo. */
    private String tipo;

    /** Especialidad (null = general). */
    private Long especializacionId;

    /** Nombre de la especialidad. */
    private String especializacionNombre;

    /** Valor antes de impuestos. */
    private BigDecimal valor;

    /** Porcentaje de IVA. */
    private BigDecimal ivaPorcentaje;

    /** Valor del IVA. */
    private BigDecimal valorIva;

    /** Valor con IVA. */
    private BigDecimal valorTotal;

    /** Si está activo. */
    private Boolean activo;

    /** Última modificación. */
    private LocalDateTime fechaModificacion;
}
