package com.uniminuto.clinica.entity;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "tarifa")
@Data
public class Tarifa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @Column(name = "codigo", nullable = false, length = 20)
    private String codigo;
    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;
    @Column(name = "descripcion", length = 500)
    private String descripcion;
    @Column(name = "tipo_servicio", nullable = false, length = 30)
    private String tipoServicio;
    @ManyToOne
    @JoinColumn(name = "especializacion_id")
    private Especializacion especializacion;
    @Column(name = "valor", nullable = false)
    private BigDecimal valor;
    @ManyToOne
    @JoinColumn(name = "impuesto_id", nullable = false)
    private Impuesto impuesto;
    @Column(name = "duracion_minutos", nullable = false)
    private Integer duracionMinutos;
    @Column(name = "activo", nullable = false)
    private Boolean activo;
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;
}
