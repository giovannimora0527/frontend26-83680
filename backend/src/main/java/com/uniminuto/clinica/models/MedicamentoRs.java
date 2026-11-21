package com.uniminuto.clinica.models;

import com.uniminuto.clinica.entity.Medicamento;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Medicamento con indicadores de inventario calculados.
 */
@Data
public class MedicamentoRs {
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
    private String impuestoCodigo;
    private BigDecimal impuestoPorcentaje;
    private Integer stockActual;
    private Integer stockMinimo;
    private LocalDate fechaCompra;
    private LocalDate fechaIngreso;
    private LocalDate fechaProximoPedido;
    private Boolean activo;
    /** Unidades en lotes NO vencidos (dispensables). */
    private int stockVigente;
    /** Unidades en lotes vencidos (no dispensables). */
    private int stockVencido;
    /** AGOTADO, BAJO_STOCK o NORMAL (sobre el stock vigente). */
    private String estadoStock;
    /** Vencimiento más próximo de los lotes vigentes con existencia. */
    private LocalDate vencimientoProximo;
    private Long diasParaVencer;
    private boolean proximoAVencer;
    private boolean conLotesVencidos;

    public static MedicamentoRs de(Medicamento m) {
        MedicamentoRs r = new MedicamentoRs();
        r.setId(m.getId());
        r.setCodigo(m.getCodigo());
        r.setNombre(m.getNombre());
        r.setDescripcion(m.getDescripcion());
        r.setPresentacion(m.getPresentacion());
        r.setTipoProducto(m.getTipoProducto());
        r.setRequiereInvima(m.getRequiereInvima());
        r.setRegistroInvima(m.getRegistroInvima());
        r.setUnidadMedida(m.getUnidadMedida());
        r.setPrecioCompra(m.getPrecioCompra());
        r.setPrecioVenta(m.getPrecioVenta());
        r.setImpuestoId(m.getImpuesto().getId());
        r.setImpuestoCodigo(m.getImpuesto().getCodigo());
        r.setImpuestoPorcentaje(m.getImpuesto().getPorcentaje());
        r.setStockActual(m.getStockActual());
        r.setStockMinimo(m.getStockMinimo());
        r.setFechaCompra(m.getFechaCompra());
        r.setFechaIngreso(m.getFechaIngreso());
        r.setFechaProximoPedido(m.getFechaProximoPedido());
        r.setActivo(m.getActivo());
        return r;
    }
}
