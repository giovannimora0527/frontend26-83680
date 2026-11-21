package com.uniminuto.clinica.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "formula_estado_historial")
@Data
public class FormulaEstadoHistorial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @Column(name = "formula_id", nullable = false)
    private Long formulaId;
    @Column(name = "estado_anterior", length = 30)
    private String estadoAnterior;
    @Column(name = "estado_nuevo", nullable = false, length = 30)
    private String estadoNuevo;
    @Column(name = "observacion", length = 500)
    private String observacion;
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;
}
