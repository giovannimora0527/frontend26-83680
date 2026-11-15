package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Fórmula médica. El listado solo trae el resumen; el detalle agrega los
 * medicamentos, el historial de estados y las entregas.
 */
@Data
public class FormulaRs {

    /**
     * Identificador de la fórmula.
     */
    private Long formulaId;

    /**
     * Fecha de emisión.
     */
    private LocalDate fechaEmision;

    /**
     * Historia clínica de origen.
     */
    private Long historiaId;

    /**
     * Fecha de la consulta de origen.
     */
    private LocalDate historiaFecha;

    /**
     * Cliente dueño de la mascota.
     */
    private Long clienteId;

    /**
     * Nombre completo del cliente.
     */
    private String clienteNombre;

    /**
     * Mascota tratada.
     */
    private Integer mascotaId;

    /**
     * Nombre de la mascota.
     */
    private String mascotaNombre;

    /**
     * Veterinario que formula.
     */
    private Long medicoId;

    /**
     * Nombre completo del veterinario.
     */
    private String medicoNombre;

    /**
     * Observaciones generales.
     */
    private String observaciones;

    /**
     * Estado de la fórmula: BORRADOR, CONFIRMADA o ANULADA.
     */
    private String estado;

    /**
     * Estado del despacho.
     */
    private String estadoDespacho;

    /**
     * Cantidad de medicamentos formulados.
     */
    private int totalMedicamentos;

    /**
     * Nombres de los medicamentos, para el listado.
     */
    private String medicamentosResumen;

    /**
     * Fecha y hora de confirmación.
     */
    private LocalDateTime fechaConfirmacion;

    /**
     * Fecha y hora de registro.
     */
    private LocalDateTime fechaCreacion;

    /**
     * Fecha y hora de la última modificación.
     */
    private LocalDateTime fechaModificacion;

    /**
     * Medicamentos formulados (solo en el detalle).
     */
    private List<FormulaDetalleRs> detalles;

    /**
     * Historial de estados (solo en el detalle).
     */
    private List<EstadoHistorialRs> historial;

    /**
     * Entregas realizadas (solo en el detalle).
     */
    private List<DespachoRs> despachos;
}
