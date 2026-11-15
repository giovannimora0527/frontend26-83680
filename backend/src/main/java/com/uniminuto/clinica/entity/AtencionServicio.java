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

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Servicio prestado en una atención, con la tarifa vigente al momento de registrarlo.
 */
@Entity
@Table(name = "atencion_servicio")
@Data
public class AtencionServicio {

    /** Identificador. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "atencion_servicio_id")
    private Long atencionServicioId;

    /** Atención (historia clínica). */
    @ManyToOne
    @JoinColumn(name = "historia_id", nullable = false)
    private HistoriaClinica historia;

    /** Servicio prestado. */
    @ManyToOne
    @JoinColumn(name = "servicio_id", nullable = false)
    private Servicio servicio;

    /** Cantidad. */
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    /** Valor unitario congelado. */
    @Column(name = "valor_unitario", nullable = false)
    private BigDecimal valorUnitario;

    /** IVA congelado. */
    @Column(name = "iva_porcentaje", nullable = false)
    private BigDecimal ivaPorcentaje;

    /** Observación. */
    @Column(name = "observacion", length = 255)
    private String observacion;

    /** Fecha de registro. */
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
}
