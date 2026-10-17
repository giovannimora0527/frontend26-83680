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
 * Cita médica de una mascota con un veterinario.
 * El cliente no se guarda aquí: se obtiene a través de la mascota, lo que
 * evita que una cita quede asociada a un cliente distinto del dueño.
 */
@Entity
@Table(name = "cita")
@Data
public class Cita {

    /**
     * Identificador único de la cita.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cita_id")
    private Long citaId;

    /**
     * Mascota que será atendida.
     */
    @ManyToOne
    @JoinColumn(name = "mascota_id", nullable = false)
    private Mascota mascota;

    /**
     * Veterinario que atiende la cita.
     */
    @ManyToOne
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    /**
     * Fecha y hora programadas para la cita.
     */
    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    /**
     * Motivo de la consulta.
     */
    @Column(name = "motivo", nullable = false, length = 500)
    private String motivo;

    /**
     * Estado actual de la cita.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoCita estado;

    /**
     * Fecha y hora en que se registró la cita.
     */
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    /**
     * Fecha y hora de la última modificación.
     */
    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;
}
