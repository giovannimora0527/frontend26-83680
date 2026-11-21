package com.uniminuto.clinica.models;

/**
 * Conteo de alertas del inventario.
 */
public record AlertasInventarioRs(long totalProductos, long agotados, long bajoStock, long proximosAVencer,
                                  long conLotesVencidos, long pedidosPendientes) {
}
