package com.uniminuto.clinica.entity;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "movimiento_inventario")
@Data
public class MovimientoInventario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @ManyToOne
    @JoinColumn(name = "medicamento_id", nullable = false)
    private Medicamento medicamento;
    @ManyToOne
    @JoinColumn(name = "lote_id")
    private LoteMedicamento lote;
    @Column(name = "tipo", nullable = false, length = 20)
    private String tipo;
    @Column(name = "concepto", nullable = false, length = 30)
    private String concepto;
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;
    @Column(name = "saldo_anterior", nullable = false)
    private Integer saldoAnterior;
    @Column(name = "saldo_nuevo", nullable = false)
    private Integer saldoNuevo;
    @Column(name = "costo_unitario", nullable = false)
    private BigDecimal costoUnitario;
    @Column(name = "formula_id")
    private Long formulaId;
    @Column(name = "despacho_id")
    private Long despachoId;
    @Column(name = "despacho_detalle_id")
    private Long despachoDetalleId;
    @Column(name = "carga_id")
    private Long cargaId;
    @Column(name = "observacion", length = 500)
    private String observacion;
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;
}
