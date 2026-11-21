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
@Table(name = "cita_historial")
@Data
public class CitaHistorial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;
    @Column(name = "accion", nullable = false, length = 30)
    private String accion;
    @Column(name = "estado_anterior", length = 20)
    private String estadoAnterior;
    @Column(name = "estado_nuevo", length = 20)
    private String estadoNuevo;
    @Column(name = "fecha_anterior")
    private LocalDateTime fechaAnterior;
    @Column(name = "fecha_nueva")
    private LocalDateTime fechaNueva;
    @Column(name = "observacion", length = 500)
    private String observacion;
    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;
}
