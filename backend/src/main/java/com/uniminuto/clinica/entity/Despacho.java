package com.uniminuto.clinica.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entrega confirmada de medicamentos de una fórmula. Una fórmula puede tener
 * varias entregas (despachos parciales). Una entrega no se elimina: si hay
 * un error se revierte, dejando registrado quién y por qué.
 */
@Entity
@Table(name = "despacho")
@Data
public class Despacho {

    /**
     * Identificador de la entrega.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "despacho_id")
    private Long despachoId;

    /**
     * Fórmula despachada.
     */
    @ManyToOne
    @JoinColumn(name = "formula_id", nullable = false)
    private FormulaMedica formula;

    /**
     * Usuario de despacho responsable.
     */
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /**
     * Estado de la entrega.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 12)
    private EstadoEntrega estado;

    /**
     * Fecha y hora de la entrega.
     */
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    /**
     * Observación de la entrega.
     */
    @Column(name = "observacion")
    private String observacion;

    /**
     * Usuario que revirtió la entrega.
     */
    @ManyToOne
    @JoinColumn(name = "usuario_reversion_id")
    private Usuario usuarioReversion;

    /**
     * Fecha y hora de la reversión.
     */
    @Column(name = "fecha_reversion")
    private LocalDateTime fechaReversion;

    /**
     * Motivo de la reversión.
     */
    @Column(name = "motivo_reversion")
    private String motivoReversion;

    /**
     * Medicamentos y lotes entregados.
     */
    @OneToMany(mappedBy = "despacho", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<DespachoDetalle> detalles = new ArrayList<>();
}
