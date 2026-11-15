package com.uniminuto.clinica.entity;

/**
 * Tipos de producto del inventario. El registro Invima y la fecha de
 * vencimiento son obligatorios para MEDICAMENTO, pero no para INSUMO
 * (utensilios de uso veterinario).
 */
public enum TipoProducto {
    MEDICAMENTO,
    INSUMO
}
