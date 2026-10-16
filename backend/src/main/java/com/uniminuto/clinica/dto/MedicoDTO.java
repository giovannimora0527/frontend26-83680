package com.uniminuto.clinica.dto;

/** Información pública básica del veterinario. */
public record MedicoDTO(Long id, String nombres, String apellidos, String nombreCompleto,
        String registroProfesional) { }
