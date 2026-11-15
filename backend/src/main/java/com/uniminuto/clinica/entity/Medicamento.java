package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Producto del inventario: medicamento o insumo. Las existencias, los precios
 * de compra y los vencimientos están en sus lotes ({@link LoteMedicamento}).
 */
@Entity
@Data
@Table(name = "medicamento")
public class Medicamento {

    /**
     * Identificador del producto.
     */
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Código interno de 8 caracteres alfanuméricos.
     */
    @Column(name = "codigo", nullable = false, length = 8, unique = true)
    private String codigo;

    /**
     * Nombre del producto.
     */
    @Column(name = "nombre", nullable = false, length = 100, unique = true)
    private String nombre;

    /**
     * Descripción del producto.
     */
    @Column(name = "descripcion")
    private String descripcion;

    /**
     * Presentación (tabletas, jarabe, unidad...).
     */
    @Column(name = "presentacion")
    private String presentacion;

    /**
     * Tipo de producto.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 12)
    private TipoProducto tipo;

    /**
     * Registro sanitario Invima (obligatorio para medicamentos).
     */
    @Column(name = "registro_invima", length = 30)
    private String registroInvima;

    /**
     * Precio de venta al público.
     */
    @Column(name = "precio_venta", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioVenta;

    /**
     * Porcentaje de IVA del producto (0 a 100).
     */
    @Column(name = "iva_porcentaje", nullable = false)
    private BigDecimal ivaPorcentaje = BigDecimal.ZERO;

    /**
     * Existencia mínima permitida antes de generar alerta.
     */
    @Column(name = "stock_minimo", nullable = false)
    private Integer stockMinimo;

    /**
     * Fecha prevista del próximo pedido.
     */
    @Column(name = "fecha_proximo_pedido")
    private LocalDate fechaProximoPedido;

    /**
     * Indica si el producto se puede seguir formulando y abasteciendo.
     */
    @Column(name = "activo", nullable = false)
    private Boolean activo;

    /**
     * Fecha y hora de creación del registro.
     */
    @Column(name = "fecha_creacion_registro")
    private LocalDateTime fechaCreacionRegistro;

    /**
     * Fecha y hora de la última modificación.
     */
    @Column(name = "fecha_modificacion_registro")
    private LocalDateTime fechaModificacionRegistro;
}
