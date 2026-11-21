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
@Table(name = "anotacion_historia")
@Data
public class AnotacionHistoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "historia_id", nullable = false)
    private HistoriaMedica historia;
    @ManyToOne
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;
    @Column(name = "descripcion", nullable = false, columnDefinition = "TEXT")
    private String descripcion;
    @Column(name = "diagnostico", columnDefinition = "TEXT")
    private String diagnostico;
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    public Long getHistoriaId() {
        return historia == null ? null : historia.getId();
    }
}
