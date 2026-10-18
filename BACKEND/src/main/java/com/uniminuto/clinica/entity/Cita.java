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
 * Representa una cita médica veterinaria. Relaciona un cliente, una de sus mascotas y un
 * veterinario. Las relaciones son llaves foráneas reales para impedir información huérfana.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@Entity
@Table(name = "cita")
@Data
public class Cita {

    /** Identificador único de la cita (clave primaria autoincrementable). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Cliente dueño de la mascota que asiste a la cita. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    /** Mascota que recibe la atención. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "mascota_id", nullable = false)
    private Mascota mascota;

    /** Veterinario asignado. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    /** Fecha y hora programada de la cita. */
    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    /** Motivo de la consulta. */
    @Column(name = "motivo", columnDefinition = "TEXT")
    private String motivo;

    /** Estado de la cita (ver {@link com.uniminuto.clinica.enums.EstadoCita}). */
    @Column(name = "estado", length = 50)
    private String estado;
}
