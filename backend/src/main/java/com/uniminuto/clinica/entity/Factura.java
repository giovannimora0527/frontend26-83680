package com.uniminuto.clinica.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Factura de una atención médica. Hay una sola vigente por atención (si se anula,
 * la atención se puede facturar de nuevo), conserva los valores con que se facturó y no se elimina:
 * se anula con motivo.
 */
@Entity
@Table(name = "factura")
@Data
public class Factura {

    /** Identificador. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "factura_id")
    private Long facturaId;

    /** Número consecutivo (FV-000001). */
    @Column(name = "numero", nullable = false, length = 20)
    private String numero;

    /** Atención facturada. */
    @ManyToOne
    @JoinColumn(name = "historia_id", nullable = false)
    private HistoriaClinica historia;

    /** Propietario. */
    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    /** Mascota. */
    @ManyToOne
    @JoinColumn(name = "mascota_id", nullable = false)
    private Mascota mascota;

    /** Veterinario. */
    @ManyToOne
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    /** Especialidad al momento de facturar. */
    @Column(name = "especialidad", nullable = false, length = 100)
    private String especialidad;

    /** Fecha de generación. */
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    /** Suma de cantidades por valores unitarios. */
    @Column(name = "subtotal", nullable = false)
    private BigDecimal subtotal;

    /** Descuento autorizado. */
    @Column(name = "descuento", nullable = false)
    private BigDecimal descuento;

    /** Motivo del descuento. */
    @Column(name = "motivo_descuento", length = 255)
    private String motivoDescuento;

    /** IVA total. */
    @Column(name = "iva", nullable = false)
    private BigDecimal iva;

    /** Total a pagar. */
    @Column(name = "total", nullable = false)
    private BigDecimal total;

    /** Valor pagado. */
    @Column(name = "pagado", nullable = false)
    private BigDecimal pagado;

    /** Estado de pago. */
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoFactura estado;

    /** Usuario que la generó. */
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** Usuario que la anuló. */
    @ManyToOne
    @JoinColumn(name = "usuario_anulacion_id")
    private Usuario usuarioAnulacion;

    /** Fecha de anulación. */
    @Column(name = "fecha_anulacion")
    private LocalDateTime fechaAnulacion;

    /** Motivo de la anulación. */
    @Column(name = "motivo_anulacion", length = 255)
    private String motivoAnulacion;

    /** Líneas de la factura. */
    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL)
    @OrderBy("detalleId")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<FacturaDetalle> detalles = new ArrayList<>();

    /** Pagos registrados. */
    @OneToMany(mappedBy = "factura")
    @OrderBy("fecha")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Pago> pagos = new ArrayList<>();
}
