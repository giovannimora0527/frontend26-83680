package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Solicitud para crear o editar un producto del inventario.
 */
@Data
public class MedicamentoRq {

    /**
     * Código de 8 caracteres alfanuméricos.
     */
    private String codigo;

    /**
     * Nombre del producto.
     */
    private String nombre;

    /**
     * Descripción (opcional).
     */
    private String descripcion;

    /**
     * Presentación (opcional).
     */
    private String presentacion;

    /**
     * Tipo: MEDICAMENTO o INSUMO.
     */
    private String tipo;

    /**
     * Registro Invima (obligatorio para medicamentos).
     */
    private String registroInvima;

    /**
     * Precio de venta al público.
     */
    private BigDecimal precioVenta;

    /**
     * Porcentaje de IVA (opcional, 0 por defecto).
     */
    private BigDecimal ivaPorcentaje;

    /**
     * Existencia mínima permitida.
     */
    private Integer stockMinimo;

    /**
     * Fecha prevista del próximo pedido (opcional).
     */
    private LocalDate fechaProximoPedido;
}
