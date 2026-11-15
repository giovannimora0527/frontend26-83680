package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

/**
 * Catálogo de estados de la cita (nombre visible y color del calendario).
 * La columna cita.estado tiene llave foránea a esta tabla.
 */
@Entity
@Table(name = "estado_cita")
@Data
public class EstadoCitaCatalogo {

    /**
     * Código del estado (coincide con {@link EstadoCita}).
     */
    @Id
    @Column(name = "codigo", length = 20)
    private String codigo;

    /**
     * Nombre visible.
     */
    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre;

    /**
     * Descripción.
     */
    @Column(name = "descripcion", length = 200)
    private String descripcion;

    /**
     * Color en el calendario (#rrggbb).
     */
    @Column(name = "color", nullable = false, length = 7)
    private String color;

    /**
     * Si es un estado final (atendida o cancelada).
     */
    @Column(name = "es_final", nullable = false)
    private Boolean esFinal;

    /**
     * Orden de presentación.
     */
    @Column(name = "orden", nullable = false)
    private Integer orden;
}
