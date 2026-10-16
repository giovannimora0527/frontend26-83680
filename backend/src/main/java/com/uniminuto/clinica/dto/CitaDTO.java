package com.uniminuto.clinica.dto;

import java.time.LocalDateTime;

/** Representa una cita y los nombres que se muestran en las tablas del frontend. */
public record CitaDTO(Long id, Long clienteId, String clienteNombre, Long mascotaId,
        String mascotaNombre, Long medicoId, String medicoNombre, LocalDateTime fechaHora,
        String estado, String motivo) { }
