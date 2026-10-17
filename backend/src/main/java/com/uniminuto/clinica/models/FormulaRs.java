package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Fórmula médica con los nombres de las entidades relacionadas, lista para
 * mostrar en el listado y en el detalle.
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
     * Medicamento formulado.
     */
    private Long medicamentoId;

    /**
     * Nombre del medicamento.
     */
    private String medicamentoNombre;

    /**
     * Cantidad por toma.
     */
    private BigDecimal dosis;

    /**
     * Unidad de la dosis.
     */
    private String unidadDosis;

    /**
     * Horas entre tomas.
     */
    private Integer frecuenciaHoras;

    /**
     * Días de tratamiento.
     */
    private Integer duracionDias;

    /**
     * Indicaciones.
     */
    private String indicaciones;

    /**
     * Estado (ACTIVA o INACTIVA).
     */
    private String estado;

    /**
     * Fecha y hora de registro.
     */
    private LocalDateTime fechaCreacion;

    /**
     * Fecha y hora de la última modificación.
     */
    private LocalDateTime fechaModificacion;
}
