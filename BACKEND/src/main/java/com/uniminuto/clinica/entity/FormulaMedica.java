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
 * Fórmula médica emitida por un veterinario para una mascota dentro de una historia clínica.
 * No se elimina físicamente: se inactiva, para conservar la trazabilidad clínica.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@Entity
@Table(name = "formula_medica")
@Data
public class FormulaMedica {

    /** Identificador único de la fórmula. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Cita (consulta) de la que proviene la fórmula; se deriva de la historia clínica. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;

    /** Historia clínica a la que pertenece la fórmula. */
    @ManyToOne
    @JoinColumn(name = "historia_id")
    private HistoriaClinica historia;

    /** Mascota a la que se le formula. */
    @ManyToOne
    @JoinColumn(name = "mascota_id")
    private Mascota mascota;

    /** Veterinario que emite la fórmula. */
    @ManyToOne
    @JoinColumn(name = "medico_id")
    private Medico medico;

    /** Medicamento formulado. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "medicamento_id", nullable = false)
    private Medicamento medicamento;

    /** Fecha de emisión de la fórmula (se guarda a las 00:00 del día indicado). */
    @Column(name = "fecha_emision")
    private LocalDateTime fechaEmision;

    /** Dosis, con número y unidad (por ejemplo "5 mg"). */
    @Column(name = "dosis", nullable = false)
    private String dosis;

    /** Frecuencia de administración (por ejemplo "cada 8 horas"). */
    @Column(name = "frecuencia", length = 100)
    private String frecuencia;

    /** Duración del tratamiento en días. */
    @Column(name = "duracion_dias")
    private Integer duracionDias;

    /** Indicaciones para quien administra el medicamento. */
    @Column(name = "indicaciones")
    private String indicaciones;

    /** Fecha y hora en que se creó el registro. */
    @Column(name = "fecha_creacion_registro", nullable = false)
    private LocalDateTime fechaCreacionRegistro;

    /** Fecha y hora de la última actualización del registro. */
    @Column(name = "fecha_actualizacion_registro")
    private LocalDateTime fechaActualizacionRegistro;

    /** Indica si la fórmula está activa; {@code false} equivale a "inactivada". */
    @Column(name = "activa", nullable = false)
    private Boolean activa;
}
