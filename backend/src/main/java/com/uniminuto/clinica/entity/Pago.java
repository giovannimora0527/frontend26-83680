package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import java.time.LocalDateTime;

/**
 * Pago registrado sobre una factura.
 */
@Entity
@Table(name = "pago")
@Data
public class Pago {

    /** Identificador. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pago_id")
    private Long pagoId;

    /** Factura pagada. */
    @ManyToOne
    @JoinColumn(name = "factura_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Factura factura;

    /** Fecha y hora del pago. */
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    /** Valor pagado. */
    @Column(name = "valor", nullable = false)
    private BigDecimal valor;

    /** Medio de pago. */
    @Enumerated(EnumType.STRING)
    @Column(name = "medio", nullable = false, length = 20)
    private MedioPago medio;

    /** Referencia (comprobante, número de transacción). */
    @Column(name = "referencia", length = 100)
    private String referencia;

    /** Usuario que registró el pago. */
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
}
