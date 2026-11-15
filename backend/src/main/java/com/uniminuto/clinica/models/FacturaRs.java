package com.uniminuto.clinica.models;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Factura (o vista previa de la factura de una atención).
 */
@Data
public class FacturaRs {

    /** Identificador (null en la vista previa). */
    private Long facturaId;

    /** Número (null en la vista previa). */
    private String numero;

    /** Atención facturada. */
    private Long historiaId;

    /** Cita atendida. */
    private Long citaId;

    /** Fecha de la atención. */
    private LocalDateTime fechaAtencion;

    /** Fecha de generación. */
    private LocalDateTime fecha;

    /** Propietario. */
    private Long clienteId;

    /** Nombre del propietario. */
    private String clienteNombre;

    /** Documento del propietario. */
    private String clienteDocumento;

    /** Teléfono del propietario. */
    private String clienteTelefono;

    /** Dirección del propietario. */
    private String clienteDireccion;

    /** Mascota. */
    private Integer mascotaId;

    /** Nombre de la mascota. */
    private String mascotaNombre;

    /** Raza de la mascota. */
    private String mascotaRaza;

    /** Veterinario. */
    private String medicoNombre;

    /** Especialidad. */
    private String especialidad;

    /** Subtotal. */
    private BigDecimal subtotal;

    /** Descuento. */
    private BigDecimal descuento;

    /** Motivo del descuento. */
    private String motivoDescuento;

    /** IVA. */
    private BigDecimal iva;

    /** Total. */
    private BigDecimal total;

    /** Pagado. */
    private BigDecimal pagado;

    /** Saldo pendiente. */
    private BigDecimal saldo;

    /** Estado de pago. */
    private String estado;

    /** Usuario que la generó. */
    private String usuario;

    /** Usuario que la anuló. */
    private String usuarioAnulacion;

    /** Fecha de anulación. */
    private LocalDateTime fechaAnulacion;

    /** Motivo de anulación. */
    private String motivoAnulacion;

    /** Líneas. */
    private List<LineaCobroRs> lineas;

    /** Pagos. */
    private List<PagoRs> pagos;

    /** Advertencias de la vista previa (por ejemplo, medicamentos aún sin despachar). */
    private List<String> advertencias;
}
