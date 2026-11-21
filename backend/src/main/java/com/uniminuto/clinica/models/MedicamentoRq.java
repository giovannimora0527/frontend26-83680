package com.uniminuto.clinica.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Registro / edición de un medicamento o producto. Las existencias NO se
 * editan aquí: entran por lotes (compra o carga masiva) y salen por dispensación.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MedicamentoRq {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String presentacion;
    private String tipoProducto;
    private Boolean requiereInvima;
    private String registroInvima;
    private String unidadMedida;
    private BigDecimal precioCompra;
    private BigDecimal precioVenta;
    private Long impuestoId;
    private Integer stockMinimo;
    private LocalDate fechaProximoPedido;
    /** Lote inicial opcional al crear. */
    private LoteRq loteInicial;
}
