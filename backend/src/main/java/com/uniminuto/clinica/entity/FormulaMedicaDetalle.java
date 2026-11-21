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
@Table(name = "formula_medica_detalle")
@Getter
@Setter
public class FormulaMedicaDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "formula_id", nullable = false)
    private FormulaMedica formula;
    @ManyToOne
    @JoinColumn(name = "medicamento_id", nullable = false)
    private Medicamento medicamento;
    @Column(name = "dosis", nullable = false, length = 100)
    private String dosis;
    @Column(name = "dosis_cantidad", nullable = false)
    private BigDecimal dosisCantidad;
    @Column(name = "frecuencia_horas", nullable = false)
    private Integer frecuenciaHoras;
    @Column(name = "duracion_dias", nullable = false)
    private Integer duracionDias;
    @Column(name = "cantidad_prescrita", nullable = false)
    private Integer cantidadPrescrita;
    @Column(name = "cantidad_despachada", nullable = false)
    private Integer cantidadDespachada;
    @Column(name = "via_administracion", nullable = false, length = 30)
    private String viaAdministracion;
    @Column(name = "indicaciones", columnDefinition = "TEXT")
    private String indicaciones;

    public Integer getCantidadPendiente() {
        return cantidadPrescrita - cantidadDespachada;
    }
}
