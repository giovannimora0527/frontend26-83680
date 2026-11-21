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
@Table(name = "tarifa_historial")
@Data
public class TarifaHistorial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @ManyToOne
    @JoinColumn(name = "tarifa_id", nullable = false)
    private Tarifa tarifa;
    @Column(name = "accion", nullable = false, length = 20)
    private String accion;
    @Column(name = "valor_anterior")
    private BigDecimal valorAnterior;
    @Column(name = "valor_nuevo")
    private BigDecimal valorNuevo;
    @Column(name = "impuesto_anterior", length = 20)
    private String impuestoAnterior;
    @Column(name = "impuesto_nuevo", length = 20)
    private String impuestoNuevo;
    @Column(name = "detalle", length = 1000)
    private String detalle;
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;
}
