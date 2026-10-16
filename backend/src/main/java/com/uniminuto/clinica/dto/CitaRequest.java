package com.uniminuto.clinica.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/** Datos recibidos para agendar o actualizar una cita. */
public record CitaRequest(
        @NotNull Long clienteId, @NotNull Long mascotaId, @NotNull Long medicoId,
        @NotNull LocalDateTime fechaHora, @NotBlank String estado,
        @Size(max = 2000) String motivo) { }
