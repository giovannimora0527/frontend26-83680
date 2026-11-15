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
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;

/**
 * Línea de una factura: un servicio prestado o un medicamento dispensado, con
 * los valores congelados al facturar.
 */
@Entity
@Table(name = "factura_detalle")
@Data
public class FacturaDetalle {

    /** Identificador. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detalle_id")
    private Long detalleId;

    /** Factura. */
    @ManyToOne
    @JoinColumn(name = "factura_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Factura factura;

    /** SERVICIO o MEDICAMENTO. */
    @Column(name = "tipo", nullable = false, length = 20)
    private String tipo;

    /** Servicio (si aplica). */
    @ManyToOne
    @JoinColumn(name = "servicio_id")
    private Servicio servicio;

    /** Medicamento (si aplica). */
    @ManyToOne
    @JoinColumn(name = "medicamento_id")
    private Medicamento medicamento;

    /** Descripción. */
    @Column(name = "descripcion", nullable = false, length = 200)
    private String descripcion;

    /** Cantidad. */
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    /** Valor unitario. */
    @Column(name = "valor_unitario", nullable = false)
    private BigDecimal valorUnitario;

    /** Porcentaje de IVA. */
    @Column(name = "iva_porcentaje", nullable = false)
    private BigDecimal ivaPorcentaje;

    /** Subtotal. */
    @Column(name = "subtotal", nullable = false)
    private BigDecimal subtotal;

    /** Descuento de la línea. */
    @Column(name = "descuento", nullable = false)
    private BigDecimal descuento;

    /** IVA de la línea. */
    @Column(name = "iva", nullable = false)
    private BigDecimal iva;

    /** Total de la línea. */
    @Column(name = "total", nullable = false)
    private BigDecimal total;
}
