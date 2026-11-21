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
@Table(name = "lote_medicamento")
@Data
public class LoteMedicamento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @ManyToOne
    @JoinColumn(name = "medicamento_id", nullable = false)
    private Medicamento medicamento;
    @Column(name = "numero_lote", nullable = false, length = 50)
    private String numeroLote;
    @Column(name = "fecha_compra", nullable = false)
    private LocalDate fechaCompra;
    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDate fechaIngreso;
    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;
    @Column(name = "precio_compra", nullable = false)
    private BigDecimal precioCompra;
    @Column(name = "cantidad_inicial", nullable = false)
    private Integer cantidadInicial;
    @Column(name = "cantidad_disponible", nullable = false)
    private Integer cantidadDisponible;
    @Column(name = "activo", nullable = false)
    private Boolean activo;
    @Column(name = "usuario_id", nullable = false)
    private Integer usuarioId;
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    public boolean estaVencido(LocalDate hoy) {
        return fechaVencimiento != null && !fechaVencimiento.isAfter(hoy);
    }
}
