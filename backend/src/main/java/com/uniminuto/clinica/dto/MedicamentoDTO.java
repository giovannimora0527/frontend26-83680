package com.uniminuto.clinica.dto;

/** Información del medicamento usada en el formulario de fórmula médica. */
public record MedicamentoDTO(Long id, String nombre, String descripcion, String presentacion,
        java.time.LocalDate fechaVence) { }
