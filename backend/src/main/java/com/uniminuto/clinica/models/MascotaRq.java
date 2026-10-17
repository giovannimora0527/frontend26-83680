package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Solicitud para crear o editar una mascota. El dueño (clienteId) solo se
 * tiene en cuenta al crear: una mascota no cambia de dueño porque arrastra
 * sus citas e historias clínicas.
 */
@Data
public class MascotaRq {

    /**
     * Nombre de la mascota (único entre las mascotas del mismo cliente).
     */
    private String nombreMascota;

    /**
     * Edad en años (0 a 40).
     */
    private Integer edad;

    /**
     * Raza de la mascota.
     */
    private Integer razaId;

    /**
     * Cliente propietario (solo al crear).
     */
    private Long clienteId;
}
