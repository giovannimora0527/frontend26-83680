package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Atención médica de una cita: datos del paciente, antecedentes, registro clínico,
 * servicios prestados y fórmulas.
 */
@Data
public class AtencionRs {

    /** Historia clínica de la atención. */
    private Long historiaId;

    /** Cita atendida. */
    private Long citaId;

    /** Inicio de la cita. */
    private LocalDateTime citaInicio;

    /** ABIERTA (en curso) o CERRADA (finalizada). */
    private String estado;

    /** Inicio de la atención. */
    private LocalDateTime fechaHora;

    /** Fin de la atención. */
    private LocalDateTime fechaFinalizacion;

    /** Motivo de consulta. */
    private String motivo;

    /** Síntomas. */
    private String sintomas;

    /** Diagnóstico. */
    private String diagnostico;

    /** Observaciones médicas. */
    private String observaciones;

    /** Recomendaciones. */
    private String recomendaciones;

    /** Mascota. */
    private Integer mascotaId;

    /** Nombre de la mascota. */
    private String mascotaNombre;

    /** Raza y especie. */
    private String mascotaRaza;

    /** Edad en años. */
    private Integer mascotaEdad;

    /** Propietario. */
    private Long clienteId;

    /** Nombre del propietario. */
    private String clienteNombre;

    /** Documento del propietario. */
    private String clienteDocumento;

    /** Teléfono del propietario. */
    private String clienteTelefono;

    /** Veterinario. */
    private Long medicoId;

    /** Nombre del veterinario. */
    private String medicoNombre;

    /** Especialidad. */
    private String especialidad;

    /** Atenciones anteriores de la mascota. */
    private List<AntecedenteRs> antecedentes;

    /** Servicios prestados (con su valor). */
    private List<LineaCobroRs> servicios;

    /** Fórmulas de la atención. */
    private List<FormulaRs> formulas;

    /** Total de los servicios (con IVA). */
    private BigDecimal totalServicios;

    /** Factura generada, si ya se facturó. */
    private Long facturaId;

    /** Número de la factura. */
    private String facturaNumero;
}
