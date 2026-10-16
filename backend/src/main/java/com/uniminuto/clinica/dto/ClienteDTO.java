package com.uniminuto.clinica.dto;

/** Datos de cliente utilizados en los combos y tablas del frontend. */
public record ClienteDTO(Long id, String nombres, String apellidos, String nombreCompleto,
        String tipoDocumento, String numeroDocumento, String telefono, Boolean activo) { }
