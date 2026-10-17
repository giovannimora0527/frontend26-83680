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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Fórmula médica emitida por un veterinario dentro de una historia clínica.
 * La mascota y el cliente se obtienen de la historia, así no se pueden
 * guardar datos contradictorios.
 */
@Entity
@Table(name = "formula_medica")
@Data
public class FormulaMedica {

    /**
     * Identificador único de la fórmula.
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
     * Medicamento formulado.
     */
    @ManyToOne
    @JoinColumn(name = "medicamento_id", nullable = false)
    private Medicamento medicamento;

    /**
     * Fecha de emisión; no puede ser anterior a la consulta.
     */
    @Column(name = "fecha_emision", nullable = false)
    private LocalDate fechaEmision;

    /**
     * Cantidad por toma.
     */
    @Column(name = "dosis", nullable = false, precision = 10, scale = 2)
    private BigDecimal dosis;

    /**
     * Unidad de la dosis (mg, ml, tableta...).
     */
    @Column(name = "unidad_dosis", nullable = false, length = 20)
    private String unidadDosis;

    /**
     * Horas entre tomas.
     */
    @Column(name = "frecuencia_horas", nullable = false)
    private Integer frecuenciaHoras;

    /**
     * Días de tratamiento.
     */
    @Column(name = "duracion_dias", nullable = false)
    private Integer duracionDias;

    /**
     * Indicaciones para el cliente.
     */
    @Column(name = "indicaciones", nullable = false, length = 1000)
    private String indicaciones;

    /**
     * Estado de la fórmula.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 10)
    private EstadoFormula estado;

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
}
