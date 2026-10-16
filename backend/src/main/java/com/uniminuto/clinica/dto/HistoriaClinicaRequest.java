package com.uniminuto.clinica.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Datos para registrar una historia clínica sobre una cita atendida. */
public record HistoriaClinicaRequest(@NotNull Long clienteId, @NotNull Long mascotaId,
        @NotNull Long citaId, @NotNull Long medicoId,
        @NotBlank @Size(max = 2000) String motivoConsulta,
        @NotBlank @Size(max = 4000) String diagnostico,
        @Size(max = 4000) String observaciones) { }
