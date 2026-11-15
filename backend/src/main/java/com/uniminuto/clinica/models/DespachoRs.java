package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entrega de medicamentos con su trazabilidad.
 */
@Data
public class DespachoRs {

    /**
     * Identificador de la entrega.
     */
    private Long despachoId;

    /**
     * Fórmula despachada.
     */
    private Long formulaId;

    /**
     * Fecha y hora de la entrega.
     */
    private LocalDateTime fecha;

    /**
     * Usuario de despacho responsable.
     */
    private String usuario;

    /**
     * Estado de la entrega: CONFIRMADO o REVERTIDO.
     */
    private String estado;

    /**
     * Estado actual del despacho de la fórmula.
     */
    private String estadoDespachoFormula;

    /**
     * Observación de la entrega.
     */
    private String observacion;

    /**
     * Nombre de la mascota.
     */
    private String mascotaNombre;

    /**
     * Nombre del propietario.
     */
    private String clienteNombre;

    /**
     * Veterinario que formuló.
     */
    private String medicoNombre;

    /**
     * Usuario que revirtió la entrega.
     */
    private String usuarioReversion;

    /**
     * Fecha y hora de la reversión.
     */
    private LocalDateTime fechaReversion;

    /**
     * Motivo de la reversión.
     */
    private String motivoReversion;

    /**
     * Medicamentos y lotes entregados.
     */
    private List<DespachoDetalleRs> detalles;
}
