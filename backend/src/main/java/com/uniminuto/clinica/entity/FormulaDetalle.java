package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;

/**
 * Medicamento formulado dentro de una fórmula médica.
 */
@Entity
@Table(name = "formula_detalle")
@Data
public class FormulaDetalle {

    /**
     * Identificador de la línea.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detalle_id")
    private Long detalleId;

    /**
     * Fórmula a la que pertenece.
     */
    @ManyToOne
    @JoinColumn(name = "formula_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private FormulaMedica formula;

    /**
     * Medicamento o insumo formulado.
     */
    @ManyToOne
    @JoinColumn(name = "medicamento_id", nullable = false)
    private Medicamento medicamento;

    /**
     * Cantidad por toma.
     */
    @Column(name = "dosis", nullable = false, precision = 10, scale = 2)
    private BigDecimal dosis;

    /**
     * Unidad de la dosis.
     */
    @Column(name = "unidad_dosis", nullable = false, length = 20)
    private String unidadDosis;

    /**
     * Horas entre tomas.
     */
    @Column(name = "frecuencia_horas", nullable = false)
    private Integer frecuenciaHoras;

    /**
     * Días de tratamiento.
     */
    @Column(name = "duracion_dias", nullable = false)
    private Integer duracionDias;

    /**
     * Unidades del producto que se deben entregar.
     */
    @Column(name = "cantidad_prescrita", nullable = false)
    private Integer cantidadPrescrita;

    /**
     * Vía de administración (nula en fórmulas anteriores a este campo).
     */
    @Column(name = "via_administracion", length = 20)
    private String viaAdministracion;

    /**
     * Indicaciones especiales.
     */
    @Column(name = "indicaciones", nullable = false, length = 1000)
    private String indicaciones;
}
