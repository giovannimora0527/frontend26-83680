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
@Table(name = "carga_masiva_detalle")
@Data
public class CargaMasivaDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @Column(name = "carga_id", nullable = false)
    private Long cargaId;
    @Column(name = "fila", nullable = false)
    private Integer fila;
    @Column(name = "codigo", length = 50)
    private String codigo;
    @Column(name = "nombre")
    private String nombre;
    @Column(name = "datos", nullable = false, columnDefinition = "TEXT")
    private String datos;
    @Column(name = "valido", nullable = false)
    private Boolean valido;
    @Column(name = "errores", columnDefinition = "TEXT")
    private String errores;
    @Column(name = "estado", nullable = false, length = 20)
    private String estado;
    @Column(name = "medicamento_id")
    private Long medicamentoId;
    @Column(name = "lote_id")
    private Long loteId;
}
