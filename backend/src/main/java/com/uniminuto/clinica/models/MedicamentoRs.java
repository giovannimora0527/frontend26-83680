package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Producto del inventario con sus existencias y alertas calculadas a partir
 * de sus lotes.
 */
@Data
public class MedicamentoRs {

    /**
     * Identificador del producto.
     */
    private Long id;

    /**
     * Código interno.
     */
    private String codigo;

    /**
     * Nombre.
     */
    private String nombre;

    /**
     * Descripción.
     */
    private String descripcion;

    /**
     * Presentación.
     */
    private String presentacion;

    /**
     * Tipo: MEDICAMENTO o INSUMO.
     */
    private String tipo;

    /**
     * Registro Invima.
     */
    private String registroInvima;

    /**
     * Precio de venta al público.
     */
    private BigDecimal precioVenta;

    /**
     * Porcentaje de IVA.
     */
    private BigDecimal ivaPorcentaje;

    /**
     * Precio de compra del lote ingresado más recientemente.
     */
    private BigDecimal ultimoPrecioCompra;

    /**
     * Existencia mínima permitida.
     */
    private Integer stockMinimo;

    /**
     * Fecha prevista del próximo pedido.
     */
    private LocalDate fechaProximoPedido;

    /**
     * Indica si el producto está activo.
     */
    private Boolean activo;

    /**
     * Unidades disponibles en lotes vigentes.
     */
    private Integer cantidadDisponible;

    /**
     * Unidades en lotes vencidos (no se pueden entregar).
     */
    private Integer cantidadVencida;

    /**
     * Vencimiento más cercano entre los lotes vigentes con existencias.
     */
    private LocalDate proximoVencimiento;

    /**
     * Estado de existencias: NORMAL, STOCK_BAJO o AGOTADO.
     */
    private String estadoStock;

    /**
     * Indica si algún lote con existencias vence pronto.
     */
    private boolean proximoAVencer;

    /**
     * Indica si hay existencias vencidas.
     */
    private boolean tieneVencidos;

    /**
     * Fecha y hora de creación.
     */
    private LocalDateTime fechaCreacion;

    /**
     * Fecha y hora de la última modificación.
     */
    private LocalDateTime fechaModificacion;

    /**
     * Lotes del producto (solo en la consulta de detalle).
     */
    private List<LoteRs> lotes;
}
