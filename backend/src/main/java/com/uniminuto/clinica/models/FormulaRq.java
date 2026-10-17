package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Solicitud para crear o editar una fórmula médica. Mascota, historia y
 * veterinario solo se tienen en cuenta al crear: una fórmula emitida no
 * cambia de paciente, de consulta ni de veterinario.
 */
@Data
public class FormulaRq {

    /**
     * Mascota a la que se formula (solo al crear).
     */
    private Integer mascotaId;

    /**
     * Historia clínica de la mascota (solo al crear).
     */
    private Long historiaId;

    /**
     * Veterinario que formula (solo al crear).
     */
    private Long medicoId;

    /**
     * Fecha de emisión.
     */
    private LocalDate fechaEmision;

    /**
     * Medicamento formulado.
     */
    private Long medicamentoId;

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
     * Indicaciones para el cliente.
     */
    private String indicaciones;
}
