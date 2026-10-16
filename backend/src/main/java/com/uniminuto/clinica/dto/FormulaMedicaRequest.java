package com.uniminuto.clinica.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/** Datos necesarios para crear o actualizar una fórmula médica. */
public record FormulaMedicaRequest(
        @NotNull Long citaId,
        @NotNull Long medicamentoId,
        @NotNull LocalDateTime fechaEmision,
        @NotBlank @Size(max = 500) String dosis,
        @NotBlank @Size(max = 100) String frecuencia,
        @NotBlank @Size(max = 100) String duracionTratamiento,
        @Size(max = 2000) String indicaciones) { }
