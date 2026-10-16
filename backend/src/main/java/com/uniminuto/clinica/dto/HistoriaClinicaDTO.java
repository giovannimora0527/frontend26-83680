package com.uniminuto.clinica.dto;

import java.time.LocalDateTime;

/** Representa una historia clínica relacionada con cliente, mascota, cita y veterinario. */
public record HistoriaClinicaDTO(Long id, Long clienteId, String clienteNombre,
        Long mascotaId, String mascotaNombre, Long citaId, Long medicoId, String medicoNombre,
        LocalDateTime fechaHora, LocalDateTime fechaCreacion, String motivoConsulta,
        String diagnostico, String observaciones) { }
