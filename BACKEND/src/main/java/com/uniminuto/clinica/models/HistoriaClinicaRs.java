package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Resumen de una historia clínica para el listado (sin diagnóstico ni observaciones).
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Data
public class HistoriaClinicaRs {

    /** Identificador de la historia. */
    private Long id;

    /** Fecha y hora de la consulta. */
    private LocalDateTime fechaHora;

    /** Identificador de la mascota. */
    private Integer mascotaId;

    /** Nombre de la mascota. */
    private String mascotaNombre;

    /** Identificador del cliente. */
    private Long clienteId;

    /** Nombre completo del cliente. */
    private String clienteNombre;

    /** Identificador del veterinario. */
    private Long medicoId;

    /** Nombre completo del veterinario. */
    private String medicoNombre;

    /** Motivo de la consulta. */
    private String motivoConsulta;

    /** Estado de la historia. */
    private String estado;
}
