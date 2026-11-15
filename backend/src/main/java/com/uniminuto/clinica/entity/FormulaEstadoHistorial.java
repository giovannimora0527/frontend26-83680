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

import java.time.LocalDateTime;

/**
 * Registro de un cambio de estado de una fórmula o de su despacho, con el
 * usuario responsable. No se edita ni se elimina.
 */
@Entity
@Table(name = "formula_estado_historial")
@Data
public class FormulaEstadoHistorial {

    /**
     * Identificador del registro.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "historial_id")
    private Long historialId;

    /**
     * Fórmula afectada.
     */
    @ManyToOne
    @JoinColumn(name = "formula_id", nullable = false)
    private FormulaMedica formula;

    /**
     * Estado antes del cambio (nulo al crear la fórmula).
     */
    @Column(name = "estado_anterior", length = 25)
    private String estadoAnterior;

    /**
     * Estado después del cambio.
     */
    @Column(name = "estado_nuevo", nullable = false, length = 25)
    private String estadoNuevo;

    /**
     * Usuario que realizó el cambio.
     */
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /**
     * Fecha y hora del cambio.
     */
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    /**
     * Observación o motivo.
     */
    @Column(name = "observacion")
    private String observacion;
}
