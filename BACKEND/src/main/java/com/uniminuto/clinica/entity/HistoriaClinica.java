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
 * Historia clínica de una consulta. Pertenece a una mascota (y a su cliente), se origina en una
 * cita atendida y puede tener múltiples anotaciones y fórmulas médicas.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Entity
@Table(name = "historia_clinica")
@Data
public class HistoriaClinica {

    /** Identificador único de la historia clínica. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Cliente dueño de la mascota. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    /** Mascota a la que pertenece la historia. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "mascota_id", nullable = false)
    private Mascota mascota;

    /** Cita atendida que originó la historia (una historia por cita). */
    @ManyToOne(optional = false)
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;

    /** Veterinario que realizó la consulta. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    /** Fecha y hora de la consulta. */
    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    /** Motivo de la consulta. */
    @Column(name = "motivo_consulta", nullable = false, columnDefinition = "TEXT")
    private String motivoConsulta;

    /** Diagnóstico de la consulta. */
    @Column(name = "diagnostico", nullable = false, columnDefinition = "TEXT")
    private String diagnostico;

    /** Observaciones adicionales. */
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    /** Estado de la historia (ver {@link com.uniminuto.clinica.enums.EstadoHistoria}). */
    @Column(name = "estado", nullable = false, length = 20)
    private String estado;

    /** Fecha y hora en que se creó el registro. */
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
}
