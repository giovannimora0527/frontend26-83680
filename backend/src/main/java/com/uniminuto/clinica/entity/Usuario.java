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
@Table(name = "usuario")
@Data
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "usuario_id")
    private Integer usuarioId;
    @Column(name = "username", nullable = false, length = 50, unique = true)
    private String username;
    @JsonIgnore
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;
    @Column(name = "nombre_completo", nullable = false, length = 150)
    private String nombreCompleto;
    @Column(name = "email", length = 150)
    private String email;
    @ManyToOne
    @JoinColumn(name = "perfil_id", nullable = false)
    private Perfil perfil;
    @ManyToOne
    @JoinColumn(name = "medico_id")
    private Medico medico;
    @Column(name = "activo", nullable = false)
    private Boolean activo;
    @Column(name = "ultimo_acceso")
    private LocalDateTime ultimoAcceso;
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;
}
