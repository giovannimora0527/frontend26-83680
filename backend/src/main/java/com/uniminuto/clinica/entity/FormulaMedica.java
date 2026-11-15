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
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Encabezado de una fórmula médica emitida en una consulta (historia
 * clínica). La mascota y el cliente se obtienen de la historia; cada
 * medicamento formulado es una línea ({@link FormulaDetalle}).
 */
@Entity
@Table(name = "formula_medica")
@Data
public class FormulaMedica {

    /**
     * Identificador de la fórmula.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "formula_id")
    private Long formulaId;

    /**
     * Historia clínica (consulta) en la que se emitió.
     */
    @ManyToOne
    @JoinColumn(name = "historia_id", nullable = false)
    private HistoriaClinica historia;

    /**
     * Veterinario que formula.
     */
    @ManyToOne
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    /**
     * Fecha de emisión; no puede ser anterior a la consulta.
     */
    @Column(name = "fecha_emision", nullable = false)
    private LocalDate fechaEmision;

    /**
     * Observaciones generales de la fórmula.
     */
    @Column(name = "observaciones", length = 1000)
    private String observaciones;

    /**
     * Estado de la fórmula.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 12)
    private EstadoFormula estado;

    /**
     * Estado del despacho (nulo mientras es borrador).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_despacho", length = 25)
    private EstadoDespacho estadoDespacho;

    /**
     * Fecha y hora en que el veterinario la confirmó.
     */
    @Column(name = "fecha_confirmacion")
    private LocalDateTime fechaConfirmacion;

    /**
     * Fecha y hora de registro.
     */
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    /**
     * Fecha y hora de la última modificación.
     */
    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;

    /**
     * Medicamentos formulados.
     */
    @OneToMany(mappedBy = "formula", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("detalleId")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<FormulaDetalle> detalles = new ArrayList<>();
}
