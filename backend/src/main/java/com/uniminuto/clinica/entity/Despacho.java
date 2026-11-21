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
@Table(name = "despacho")
@Getter
@Setter
public class Despacho {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @Column(name = "numero", length = 20)
    private String numero;
    @ManyToOne
    @JoinColumn(name = "formula_id", nullable = false)
    private FormulaMedica formula;
    @Column(name = "clave_idempotencia", nullable = false, length = 64)
    private String claveIdempotencia;
    @Column(name = "estado_resultante", nullable = false, length = 30)
    private String estadoResultante;
    @Column(name = "observaciones", length = 1000)
    private String observaciones;
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    @Column(name = "fecha_despacho", nullable = false)
    private LocalDateTime fechaDespacho;
    @Column(name = "revertido", nullable = false)
    private Boolean revertido;
    @Column(name = "motivo_reversion", length = 500)
    private String motivoReversion;
    @ManyToOne
    @JoinColumn(name = "usuario_reversion_id")
    private Usuario usuarioReversion;
    @Column(name = "fecha_reversion")
    private LocalDateTime fechaReversion;
    @OneToMany(mappedBy = "despacho", cascade = CascadeType.ALL)
    @OrderBy("id ASC")
    private List<DespachoDetalle> detalles = new ArrayList<>();
}
