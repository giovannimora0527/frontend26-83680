package com.uniminuto.clinica.dto;

import java.time.LocalDateTime;

/** Representa una anotación del histórico clínico. */
public record AnotacionHistoriaDTO(Long id, Long historiaId, Long medicoId,
        String medicoNombre, LocalDateTime fecha, String descripcion,
        String observacion, String diagnostico) { }
