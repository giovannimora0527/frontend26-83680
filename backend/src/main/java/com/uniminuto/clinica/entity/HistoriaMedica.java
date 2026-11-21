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
@Table(name = "historia_medica")
@Data
public class HistoriaMedica {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "paciente_id", nullable = false)
    private Mascota mascota;
    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;
    @ManyToOne
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;
    @ManyToOne
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;
    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;
    @Column(name = "motivo", nullable = false, columnDefinition = "TEXT")
    private String motivo;
    @Column(name = "sintomas", columnDefinition = "TEXT")
    private String sintomas;
    @Column(name = "diagnostico", columnDefinition = "TEXT")
    private String diagnostico;
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;
    @Column(name = "recomendaciones", columnDefinition = "TEXT")
    private String recomendaciones;
    @Column(name = "peso_kg")
    private BigDecimal pesoKg;
    @Column(name = "temperatura_c")
    private BigDecimal temperaturaC;
    @Column(name = "estado", nullable = false, length = 20)
    private String estado;
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;
}
