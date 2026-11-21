package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

/**
 * Confirmación de entrega. La clave de idempotencia (la entrega el endpoint de
 * preparación) impide descontar dos veces el inventario si se reenvía la petición.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DespachoRq {
    private Long formulaId;
    private String claveIdempotencia;
    private String observaciones;
    private List<Item> items;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Item {
        private Long formulaDetalleId;
        private Long loteId;
        private Integer cantidad;
    }
}
