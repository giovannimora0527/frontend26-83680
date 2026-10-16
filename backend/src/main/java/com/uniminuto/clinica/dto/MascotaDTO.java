package com.uniminuto.clinica.dto;

/** Datos de mascota y su dueño para combos dependientes. */
public record MascotaDTO(Long id, String nombre, Integer edad, Long clienteId,
        String clienteNombre, String especie) { }
