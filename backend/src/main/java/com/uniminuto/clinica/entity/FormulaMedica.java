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

/**
 * Encabezado de la fórmula médica. Estados: BORRADOR, CONFIRMADA, ANULADA.
 * El estado de despacho se maneja aparte (módulo de despacho).
 */
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "formula_medica")
@Getter
@Setter
public class FormulaMedica {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;
    @Column(name = "numero", length = 20)
    private String numero;
    @ManyToOne
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;
    @ManyToOne
    @JoinColumn(name = "mascota_id", nullable = false)
    private Mascota mascota;
    @ManyToOne
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;
    @Column(name = "historia_id")
    private Long historiaId;
    @Column(name = "fecha_emision", nullable = false)
    private LocalDate fechaEmision;
    @Column(name = "estado", nullable = false, length = 20)
    private String estado;
    @Column(name = "estado_despacho", nullable = false, length = 30)
    private String estadoDespacho;
    @Column(name = "indicaciones", columnDefinition = "TEXT")
    private String indicaciones;
    @Column(name = "usuario_id", nullable = false)
    private Integer usuarioId;
    @Column(name = "fecha_confirmacion")
    private LocalDateTime fechaConfirmacion;
    @Column(name = "activo", nullable = false)
    private Boolean activo;
    @Column(name = "fecha_creacion_registro", nullable = false)
    private LocalDateTime fechaCreacionRegistro;
    @Column(name = "fecha_actualizacion_registro")
    private LocalDateTime fechaActualizacionRegistro;
    @OneToMany(mappedBy = "formula", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<FormulaMedicaDetalle> detalles = new ArrayList<>();
}
