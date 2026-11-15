package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

/**
 * Unidades entregadas de una línea de la fórmula desde un lote específico.
 */
@Entity
@Table(name = "despacho_detalle")
@Data
public class DespachoDetalle {

    /**
     * Identificador del registro.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detalle_id")
    private Long detalleId;

    /**
     * Entrega a la que pertenece.
     */
    @ManyToOne
    @JoinColumn(name = "despacho_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Despacho despacho;

    /**
     * Línea de la fórmula que se entrega.
     */
    @ManyToOne
    @JoinColumn(name = "formula_detalle_id", nullable = false)
    private FormulaDetalle formulaDetalle;

    /**
     * Lote del que salen las unidades.
     */
    @ManyToOne
    @JoinColumn(name = "lote_id", nullable = false)
    private LoteMedicamento lote;

    /**
     * Unidades entregadas.
     */
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;
}
