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
 * Historia clínica de una mascota. Puede generarse a partir de una cita
 * atendida (cada cita atendida genera como máximo una historia) o registrarse
 * de forma independiente.
 */
@Entity
@Table(name = "historia_clinica")
@Data
public class HistoriaClinica {

    /**
     * Identificador único de la historia clínica.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "historia_id")
    private Long historiaId;

    /**
     * Mascota a la que pertenece la historia.
     */
    @ManyToOne
    @JoinColumn(name = "mascota_id", nullable = false)
    private Mascota mascota;

    /**
     * Veterinario que registra la historia.
     */
    @ManyToOne
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    /**
     * Cita atendida de la que proviene la historia (puede ser nula).
     */
    @ManyToOne
    @JoinColumn(name = "cita_id")
    private Cita cita;

    /**
     * Fecha y hora de la atención: la de la cita asociada o la del registro.
     */
    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    /**
     * Motivo de la consulta.
     */
    @Column(name = "motivo", nullable = false, length = 500)
    private String motivo;

    /**
     * Diagnóstico del veterinario.
     */
    @Column(name = "diagnostico", nullable = false, length = 1000)
    private String diagnostico;

    /**
     * Tratamiento indicado (opcional).
     */
    @Column(name = "observaciones", length = 1000)
    private String observaciones;

    /**
     * Estado de la historia: ABIERTA admite anotaciones, CERRADA no.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 10)
    private EstadoHistoria estado;

    /**
     * Fecha y hora en que se creó el registro.
     */
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
}
