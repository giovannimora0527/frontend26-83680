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
@Table(name = "horario_medico")
@Data
public class HorarioMedico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;
    /** 1 = lunes ... 7 = domingo (ISO-8601). */
    @Column(name = "dia_semana", nullable = false)
    private Integer diaSemana;
    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;
    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;
    @Column(name = "activo", nullable = false)
    private Boolean activo;

    public Long getMedicoId() {
        return medico == null ? null : medico.getId();
    }
}
