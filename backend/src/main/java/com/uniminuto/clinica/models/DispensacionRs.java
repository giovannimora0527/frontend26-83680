package com.uniminuto.clinica.models;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Una línea dispensada (historial de dispensaciones por medicamento).
 */
public record DispensacionRs(Long despachoId, String numeroDespacho, LocalDateTime fecha, String formula,
                             String mascota, String propietario, String veterinario, String usuarioDespacho,
                             String medicamento, String lote, LocalDate vencimientoLote, Integer cantidad,
                             boolean revertido, Long movimientoId) {
}
