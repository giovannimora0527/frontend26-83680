package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Registro de un cambio en la tarifa de un servicio (log de tarifas).
 */
@Entity
@Table(name = "servicio_tarifa_log")
@Data
public class ServicioTarifaLog {

    /** Identificador. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    /** Servicio afectado. */
    @ManyToOne
    @JoinColumn(name = "servicio_id", nullable = false)
    private Servicio servicio;

    /** Fecha y hora del cambio. */
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    /** Usuario que hizo el cambio. */
    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    /** CREADO, MODIFICADO, ACTIVADO o INACTIVADO. */
    @Column(name = "accion", nullable = false, length = 20)
    private String accion;

    /** Valor anterior. */
    @Column(name = "valor_anterior")
    private BigDecimal valorAnterior;

    /** Valor nuevo. */
    @Column(name = "valor_nuevo")
    private BigDecimal valorNuevo;

    /** IVA anterior. */
    @Column(name = "iva_anterior")
    private BigDecimal ivaAnterior;

    /** IVA nuevo. */
    @Column(name = "iva_nuevo")
    private BigDecimal ivaNuevo;

    /** Observación. */
    @Column(name = "observacion", length = 255)
    private String observacion;
}
