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
@Table(name = "atencion_servicio")
@Data
public class AtencionServicio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;
    @ManyToOne
    @JoinColumn(name = "tarifa_id", nullable = false)
    private Tarifa tarifa;
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;
    @Column(name = "observacion", length = 500)
    private String observacion;
    @Column(name = "usuario_id", nullable = false)
    private Integer usuarioId;
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;
}
