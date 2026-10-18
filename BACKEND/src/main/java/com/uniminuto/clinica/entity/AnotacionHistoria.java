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
 * Anotación médica asociada a una historia clínica. Una historia puede tener muchas anotaciones,
 * una por cada seguimiento realizado por un veterinario.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@Entity
@Table(name = "anotacion_historia")
@Data
public class AnotacionHistoria {

    /** Identificador único de la anotación. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Historia clínica a la que pertenece la anotación. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "historia_id", nullable = false)
    private HistoriaClinica historia;

    /** Veterinario que escribió la anotación. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    /** Fecha y hora en que se registró la anotación (la asigna el servidor). */
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    /** Descripción de lo realizado. */
    @Column(name = "descripcion", nullable = false)
    private String descripcion;

    /** Observación del veterinario. */
    @Column(name = "observacion", columnDefinition = "TEXT")
    private String observacion;

    /** Diagnóstico o evolución del paciente. */
    @Column(name = "diagnostico_evolucion", columnDefinition = "TEXT")
    private String diagnosticoEvolucion;
}
