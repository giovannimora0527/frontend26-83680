package com.uniminuto.clinica.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/** Datos para crear o actualizar una anotación clínica. */
public record AnotacionHistoriaRequest(@NotNull Long historiaId, @NotNull Long medicoId,
        @NotNull LocalDateTime fecha, @NotBlank @Size(max = 4000) String descripcion,
        @Size(max = 4000) String observacion, @Size(max = 4000) String diagnostico) { }
