package com.uniminuto.clinica.dto;

import java.time.LocalDateTime;

/** Datos mínimos de cita usados para validar reglas de negocio y relaciones. */
public record CitaCoreDTO(Long id, Long clienteId, Long mascotaId, Long medicoId,
        LocalDateTime fechaHora, String estado) { }
