package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Servicio facturable con su tarifa vigente (consulta, procedimiento, laboratorio u otro).
 * El administrador cambia los valores sin tocar el código; cada cambio queda en el log de tarifas.
 */
@Entity
@Table(name = "servicio")
@Data
public class Servicio {

    /** Identificador. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "servicio_id")
    private Long servicioId;

    /** Código único (por ejemplo CON-MG). */
    @Column(name = "codigo", nullable = false, length = 20)
    private String codigo;

    /** Nombre visible. */
    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    /** Descripción. */
    @Column(name = "descripcion", length = 500)
    private String descripcion;

    /** Tipo de servicio. */
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoServicio tipo;

    /** Especialidad a la que aplica (null = cualquiera). */
    @ManyToOne
    @JoinColumn(name = "especializacion_id")
    private Especializacion especializacion;

    /** Valor antes de impuestos. */
    @Column(name = "valor", nullable = false)
    private BigDecimal valor;

    /** Porcentaje de IVA. */
    @Column(name = "iva_porcentaje", nullable = false)
    private BigDecimal ivaPorcentaje;

    /** Si está disponible para nuevas atenciones. */
    @Column(name = "activo", nullable = false)
    private Boolean activo = Boolean.TRUE;

    /** Fecha de registro. */
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    /** Fecha de la última modificación. */
    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;
}
