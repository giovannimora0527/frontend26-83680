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
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Lote de un producto, con su propio precio de compra, vencimiento y existencia.
 */
@Entity
@Table(name = "lote_medicamento")
@Data
public class LoteMedicamento {

    /**
     * Identificador del lote.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lote_id")
    private Long loteId;

    /**
     * Producto al que pertenece.
     */
    @ManyToOne
    @JoinColumn(name = "medicamento_id", nullable = false)
    private Medicamento medicamento;

    /**
     * Número de lote (único por producto).
     */
    @Column(name = "numero_lote", nullable = false, length = 40)
    private String numeroLote;

    /**
     * Fecha de compra.
     */
    @Column(name = "fecha_compra", nullable = false)
    private LocalDate fechaCompra;

    /**
     * Fecha de ingreso al inventario.
     */
    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDate fechaIngreso;

    /**
     * Fecha de vencimiento (nula en insumos que no vencen).
     */
    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    /**
     * Cantidad con la que ingresó el lote.
     */
    @Column(name = "cantidad_inicial", nullable = false)
    private Integer cantidadInicial;

    /**
     * Cantidad disponible actualmente.
     */
    @Column(name = "cantidad_disponible", nullable = false)
    private Integer cantidadDisponible;

    /**
     * Precio de compra por unidad.
     */
    @Column(name = "precio_compra", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioCompra;

    /**
     * Fecha y hora de registro.
     */
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
}
