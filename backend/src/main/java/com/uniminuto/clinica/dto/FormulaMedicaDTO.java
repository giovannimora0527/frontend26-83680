package com.uniminuto.clinica.dto;

import java.time.LocalDateTime;

/** Representa la fórmula y los datos de la cita relacionados que se devuelven al frontend. */
public record FormulaMedicaDTO(
        Long id, Long citaId, Long mascotaId, Long clienteId, String clienteNombre,
        String mascotaNombre, Long medicoId, String medicoNombre, Long medicamentoId,
        String medicamentoNombre, String dosis, String frecuencia, String duracionTratamiento,
        String indicaciones, LocalDateTime fechaEmision, LocalDateTime fechaCreacionRegistro,
        LocalDateTime fechaActualizacionRegistro, Boolean activo, LocalDateTime fechaCita) { }
