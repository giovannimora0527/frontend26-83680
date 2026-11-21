package com.uniminuto.clinica.models;

import com.uniminuto.clinica.entity.FormulaMedica;

import java.time.LocalDate;
import java.util.List;

/**
 * Detalle para preparar un despacho: existencias, lotes y sugerencia FEFO.
 */
public record PreparacionRs(FormulaMedica formula, String claveIdempotencia, List<Item> items) {

    public record Item(Long formulaDetalleId, Long medicamentoId, String codigo, String medicamento,
                       String unidadMedida, String dosis, Integer frecuenciaHoras, Integer duracionDias,
                       String viaAdministracion, String indicaciones,
                       int prescrita, int despachada, int pendiente,
                       int stockVigente, int stockVencido, boolean alcanza, List<Lote> lotes) {
    }

    public record Lote(Long loteId, String numeroLote, LocalDate fechaVencimiento, int disponible,
                       boolean vencido, boolean proximoAVencer, int cantidadSugerida) {
    }
}
