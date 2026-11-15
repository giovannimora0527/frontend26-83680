package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Línea de un documento de cobro (prefactura o factura): un servicio o un medicamento.
 */
@Data
public class LineaCobroRs {

    /** Identificador del servicio prestado en la atención (solo servicios, para quitarlo). */
    private Long atencionServicioId;

    /** SERVICIO o MEDICAMENTO. */
    private String tipo;

    /** Servicio (si aplica). */
    private Long servicioId;

    /** Medicamento (si aplica). */
    private Long medicamentoId;

    /** Código del servicio o del medicamento. */
    private String codigo;

    /** Descripción. */
    private String descripcion;

    /** Cantidad. */
    private Integer cantidad;

    /** Valor unitario antes de impuestos. */
    private BigDecimal valorUnitario;

    /** Porcentaje de IVA. */
    private BigDecimal ivaPorcentaje;

    /** Cantidad por valor unitario. */
    private BigDecimal subtotal;

    /** Descuento asignado a la línea. */
    private BigDecimal descuento;

    /** IVA de la línea (sobre el subtotal menos el descuento). */
    private BigDecimal iva;

    /** Total de la línea. */
    private BigDecimal total;

    /** Observación. */
    private String observacion;
}
