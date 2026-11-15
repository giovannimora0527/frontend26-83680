package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * Solicitud para crear o editar una fórmula médica. El veterinario se toma
 * del usuario autenticado; mascota e historia solo se tienen en cuenta al crear.
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
     * Fecha de emisión.
     */
    private LocalDate fechaEmision;

    /**
     * Observaciones generales (opcional).
     */
    private String observaciones;

    /**
     * Medicamentos formulados (uno o varios).
     */
    private List<FormulaDetalleRq> detalles;

    /**
     * true para confirmarla al guardar; false para dejarla como borrador.
     */
    private boolean confirmar;
}
