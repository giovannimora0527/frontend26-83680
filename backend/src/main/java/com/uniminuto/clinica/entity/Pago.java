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
@Table(name = "pago")
@Getter
@Setter
public class Pago {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "factura_id", nullable = false)
    private Factura factura;
    @Column(name = "fecha_pago", nullable = false)
    private LocalDateTime fechaPago;
    @Column(name = "valor", nullable = false)
    private BigDecimal valor;
    @Column(name = "metodo_pago", nullable = false, length = 30)
    private String metodoPago;
    @Column(name = "referencia", length = 100)
    private String referencia;
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    @Column(name = "anulado", nullable = false)
    private Boolean anulado;
    @Column(name = "motivo_anulacion", length = 500)
    private String motivoAnulacion;
    @ManyToOne
    @JoinColumn(name = "usuario_anulacion_id")
    private Usuario usuarioAnulacion;
    @Column(name = "fecha_anulacion")
    private LocalDateTime fechaAnulacion;

    public Long getFacturaId() {
        return factura == null ? null : factura.getId();
    }
}
