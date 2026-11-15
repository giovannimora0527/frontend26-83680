package com.uniminuto.clinica.entity;

/**
 * Estados de una fórmula médica.
 * <p>
 * BORRADOR: el veterinario la puede editar; aún no llega a despacho.
 * CONFIRMADA: el veterinario la cerró; despacho la puede entregar y ya no se edita.
 * ANULADA: se anuló antes de entregar medicamentos; se conserva como registro.
 * </p>
 */
public enum EstadoFormula {
    BORRADOR,
    CONFIRMADA,
    ANULADA
}
