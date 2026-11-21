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
@Table(name = "factura")
@Getter
@Setter
public class Factura {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @Column(name = "numero", length = 20)
    private String numero;
    @ManyToOne
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;
    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;
    @ManyToOne
    @JoinColumn(name = "mascota_id", nullable = false)
    private Mascota mascota;
    @ManyToOne
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;
    @Column(name = "especializacion", nullable = false, length = 100)
    private String especializacion;
    @Column(name = "fecha_generacion", nullable = false)
    private LocalDateTime fechaGeneracion;
    @Column(name = "subtotal", nullable = false)
    private BigDecimal subtotal;
    @Column(name = "total_descuento", nullable = false)
    private BigDecimal totalDescuento;
    @Column(name = "total_impuestos", nullable = false)
    private BigDecimal totalImpuestos;
    @Column(name = "total", nullable = false)
    private BigDecimal total;
    @Column(name = "total_pagado", nullable = false)
    private BigDecimal totalPagado;
    @Column(name = "saldo", nullable = false)
    private BigDecimal saldo;
    @Column(name = "estado", nullable = false, length = 20)
    private String estado;
    @Column(name = "observaciones", length = 1000)
    private String observaciones;
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    @ManyToOne
    @JoinColumn(name = "usuario_autoriza_dcto")
    private Usuario usuarioAutorizaDescuento;
    @Column(name = "motivo_anulacion", length = 500)
    private String motivoAnulacion;
    @ManyToOne
    @JoinColumn(name = "usuario_anulacion_id")
    private Usuario usuarioAnulacion;
    @Column(name = "fecha_anulacion")
    private LocalDateTime fechaAnulacion;
    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL)
    @OrderBy("id ASC")
    private List<FacturaDetalle> detalles = new ArrayList<>();
    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL)
    @OrderBy("id ASC")
    private List<Pago> pagos = new ArrayList<>();
}
