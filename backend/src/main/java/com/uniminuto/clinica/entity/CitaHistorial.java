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
 * Cambio registrado sobre una cita: creación, edición, reprogramación o
 * cambio de estado. Las citas canceladas conservan aquí su historial.
 */
@Entity
@Table(name = "cita_historial")
@Data
public class CitaHistorial {

    /**
     * Identificador del registro.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "historial_id")
    private Long historialId;

    /**
     * Cita afectada.
     */
    @ManyToOne
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;

    /**
     * Fecha y hora del cambio.
     */
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    /**
     * Usuario que hizo el cambio.
     */
    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    /**
     * CREADA, EDITADA, REPROGRAMADA, ESTADO o REACTIVADA.
     */
    @Column(name = "accion", nullable = false, length = 20)
    private String accion;

    /**
     * Estado antes del cambio.
     */
    @Column(name = "estado_anterior", length = 20)
    private String estadoAnterior;

    /**
     * Estado después del cambio.
     */
    @Column(name = "estado_nuevo", length = 20)
    private String estadoNuevo;

    /**
     * Inicio antes del cambio (reprogramaciones).
     */
    @Column(name = "inicio_anterior")
    private LocalDateTime inicioAnterior;

    /**
     * Inicio después del cambio.
     */
    @Column(name = "inicio_nuevo")
    private LocalDateTime inicioNuevo;

    /**
     * Observación o motivo.
     */
    @Column(name = "observacion", length = 500)
    private String observacion;
}
