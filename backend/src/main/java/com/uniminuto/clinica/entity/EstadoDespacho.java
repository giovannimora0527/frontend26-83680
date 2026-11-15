package com.uniminuto.clinica.entity;

import java.util.Set;

/**
 * Estados del proceso de despacho de una fórmula confirmada.
 */
public enum EstadoDespacho {

    /**
     * La fórmula fue confirmada y todavía no se procesa.
     */
    PENDIENTE_DESPACHO,

    /**
     * El personal de despacho está verificando medicamentos y cantidades.
     */
    EN_PREPARACION,

    /**
     * Se entregó una parte de los medicamentos formulados.
     */
    DESPACHO_PARCIAL,

    /**
     * Todos los medicamentos formulados fueron entregados.
     */
    DESPACHADO,

    /**
     * Hay medicamentos que no se pueden entregar por falta de inventario.
     */
    PENDIENTE_DISPONIBILIDAD,

    /**
     * El despacho se canceló mediante el procedimiento autorizado.
     */
    CANCELADO;

    /**
     * Estados en los que la fórmula todavía tiene medicamentos por entregar.
     */
    public static final Set<EstadoDespacho> POR_ENTREGAR =
            Set.of(PENDIENTE_DESPACHO, EN_PREPARACION, DESPACHO_PARCIAL, PENDIENTE_DISPONIBILIDAD);
}
