package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Registro histórico de una entrada o salida de inventario. Los movimientos
 * no se editan ni se eliminan: garantizan la trazabilidad de las existencias.
 */
@Entity
@Table(name = "movimiento_inventario")
@Data
public class MovimientoInventario {

    /**
     * Identificador del movimiento.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "movimiento_id")
    private Long movimientoId;

    /**
     * Producto afectado.
     */
    @ManyToOne
    @JoinColumn(name = "medicamento_id", nullable = false)
    private Medicamento medicamento;

    /**
     * Lote afectado.
     */
    @ManyToOne
    @JoinColumn(name = "lote_id", nullable = false)
    private LoteMedicamento lote;

    /**
     * Tipo de movimiento.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 15)
    private TipoMovimiento tipo;

    /**
     * Unidades movidas (siempre positivo; el tipo indica el sentido).
     */
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    /**
     * Existencia del lote después del movimiento.
     */
    @Column(name = "saldo_lote", nullable = false)
    private Integer saldoLote;

    /**
     * Fecha y hora del movimiento.
     */
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    /**
     * Usuario responsable.
     */
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /**
     * Referencia legible del origen del movimiento.
     */
    @Column(name = "referencia", nullable = false, length = 100)
    private String referencia;

    /**
     * Observación o motivo (obligatorio en los ajustes).
     */
    @Column(name = "observacion")
    private String observacion;

    /**
     * Fórmula médica relacionada, cuando la salida viene de una dispensación.
     */
    @ManyToOne
    @JoinColumn(name = "formula_id")
    private FormulaMedica formula;

    /**
     * Entrega (despacho) que originó la salida o su reversión.
     */
    @ManyToOne
    @JoinColumn(name = "despacho_id")
    private Despacho despacho;
}
