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
@Table(name = "despacho_detalle")
@Getter
@Setter
public class DespachoDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "despacho_id", nullable = false)
    private Despacho despacho;
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "formula_detalle_id", nullable = false)
    private FormulaMedicaDetalle formulaDetalle;
    @ManyToOne
    @JoinColumn(name = "medicamento_id", nullable = false)
    private Medicamento medicamento;
    @ManyToOne
    @JoinColumn(name = "lote_id", nullable = false)
    private LoteMedicamento lote;
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;
    @Column(name = "precio_venta", nullable = false)
    private BigDecimal precioVenta;

    public Long getFormulaDetalleId() {
        return formulaDetalle == null ? null : formulaDetalle.getId();
    }
}
