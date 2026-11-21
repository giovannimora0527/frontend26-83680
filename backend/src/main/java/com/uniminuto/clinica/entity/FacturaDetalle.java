package com.uniminuto.clinica.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "factura_detalle")
@Getter
@Setter
public class FacturaDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "factura_id", nullable = false)
    private Factura factura;
    @Column(name = "tipo_item", nullable = false, length = 20)
    private String tipoItem;
    @ManyToOne
    @JoinColumn(name = "tarifa_id")
    private Tarifa tarifa;
    @ManyToOne
    @JoinColumn(name = "medicamento_id")
    private Medicamento medicamento;
    @Column(name = "despacho_detalle_id")
    private Long despachoDetalleId;
    @Column(name = "descripcion", nullable = false)
    private String descripcion;
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;
    @Column(name = "precio_unitario", nullable = false)
    private BigDecimal precioUnitario;
    @Column(name = "porcentaje_descuento", nullable = false)
    private BigDecimal porcentajeDescuento;
    @Column(name = "valor_descuento", nullable = false)
    private BigDecimal valorDescuento;
    @Column(name = "subtotal", nullable = false)
    private BigDecimal subtotal;
    @Column(name = "impuesto_codigo", nullable = false, length = 20)
    private String impuestoCodigo;
    @Column(name = "impuesto_porcentaje", nullable = false)
    private BigDecimal impuestoPorcentaje;
    @Column(name = "valor_impuesto", nullable = false)
    private BigDecimal valorImpuesto;
    @Column(name = "total", nullable = false)
    private BigDecimal total;
    /** false cuando la factura se anula (libera el producto dispensado para refacturar). */
    @Column(name = "activo", nullable = false)
    private Boolean activo;
}
