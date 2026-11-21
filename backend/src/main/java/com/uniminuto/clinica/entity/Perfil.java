package com.uniminuto.clinica.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "perfil")
@Data
public class Perfil {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "perfil_id")
    private Integer perfilId;
    @Column(name = "codigo", nullable = false, length = 30)
    private String codigo;
    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre;
    @Column(name = "activo", nullable = false)
    private Boolean activo;
    @JsonIgnore
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
    @JsonIgnore
    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;
}
