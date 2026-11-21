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
@Table(name = "mascota")
@Data
public class Mascota {
    @Id
    @Column(name = "mascota_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer mascotaId;
    @Column(name = "nombre_mascota", nullable = false)
    private String nombreMascota;
    @Column(name = "edad")
    private Integer edad;
    @Column(name = "sexo", length = 1)
    private String sexo;
    @Column(name = "peso_kg")
    private BigDecimal pesoKg;
    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;
    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;
    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;
    @ManyToOne
    @JoinColumn(name = "raza_id", nullable = false)
    private Raza raza;
    @Column(name = "activo", nullable = false)
    private Boolean activo;
}
