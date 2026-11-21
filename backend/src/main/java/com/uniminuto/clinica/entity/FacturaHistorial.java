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
@Table(name = "factura_historial")
@Data
public class FacturaHistorial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @Column(name = "factura_id", nullable = false)
    private Long facturaId;
    @Column(name = "accion", nullable = false, length = 30)
    private String accion;
    @Column(name = "estado_anterior", length = 20)
    private String estadoAnterior;
    @Column(name = "estado_nuevo", length = 20)
    private String estadoNuevo;
    @Column(name = "detalle", length = 1000)
    private String detalle;
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;
}
