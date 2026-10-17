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
 * Anotación posterior que un veterinario agrega a una historia clínica
 * (evolución, control, observación). Las anotaciones no se editan.
 */
@Entity
@Table(name = "anotacion")
@Data
public class Anotacion {

    /**
     * Identificador único de la anotación.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "anotacion_id")
    private Long anotacionId;

    /**
     * Historia clínica a la que pertenece.
     */
    @ManyToOne
    @JoinColumn(name = "historia_id", nullable = false)
    private HistoriaClinica historia;

    /**
     * Veterinario que escribe la anotación.
     */
    @ManyToOne
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    /**
     * Descripción de lo observado en el control.
     */
    @Column(name = "descripcion", nullable = false, length = 1000)
    private String descripcion;

    /**
     * Observación adicional (opcional).
     */
    @Column(name = "observacion", length = 1000)
    private String observacion;

    /**
     * Diagnóstico o evolución del paciente.
     */
    @Column(name = "diagnostico", nullable = false, length = 1000)
    private String diagnostico;

    /**
     * Fecha y hora en que se escribió la anotación.
     */
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
}
