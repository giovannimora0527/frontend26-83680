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
@Table(name = "estado_cita")
@Data
public class EstadoCita {
    @Id
    @Column(name = "codigo", length = 20)
    private String codigo;
    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre;
    @Column(name = "color", nullable = false, length = 10)
    private String color;
    @Column(name = "es_final", nullable = false)
    private Boolean esFinal;
    @Column(name = "orden", nullable = false)
    private Integer orden;
}
