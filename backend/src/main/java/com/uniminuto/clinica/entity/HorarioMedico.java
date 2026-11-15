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
import java.time.LocalTime;

/**
 * Franja semanal en la que un veterinario atiende citas.
 */
@Entity
@Table(name = "horario_medico")
@Data
public class HorarioMedico {

    /**
     * Identificador de la franja.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "horario_id")
    private Long horarioId;

    /**
     * Veterinario.
     */
    @ManyToOne
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    /**
     * Día de la semana: 1 = lunes ... 7 = domingo.
     */
    @Column(name = "dia_semana", nullable = false)
    private Integer diaSemana;

    /**
     * Hora de inicio de la franja.
     */
    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    /**
     * Hora de fin de la franja.
     */
    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    /**
     * Si la franja está vigente.
     */
    @Column(name = "activo", nullable = false)
    private Boolean activo = Boolean.TRUE;

    /**
     * Fecha de registro.
     */
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
}
