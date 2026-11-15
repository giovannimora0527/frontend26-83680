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

/**
 * Fila de un archivo de carga masiva, con los valores tal como venían y su resultado.
 */
@Entity
@Table(name = "carga_inventario_detalle")
@Data
public class CargaInventarioDetalle {

    /** Identificador. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detalle_id")
    private Long detalleId;

    /** Carga. */
    @ManyToOne
    @JoinColumn(name = "carga_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private CargaInventario carga;

    /** Número de fila en el archivo (la 1 es el encabezado). */
    @Column(name = "fila", nullable = false)
    private Integer fila;

    @Column(name = "codigo", length = 50)
    private String codigo;

    @Column(name = "nombre", length = 150)
    private String nombre;

    @Column(name = "tipo", length = 30)
    private String tipo;

    @Column(name = "presentacion", length = 150)
    private String presentacion;

    @Column(name = "descripcion", length = 500)
    private String descripcion;

    @Column(name = "registro_invima", length = 50)
    private String registroInvima;

    @Column(name = "precio_venta", length = 30)
    private String precioVenta;

    @Column(name = "iva", length = 30)
    private String iva;

    @Column(name = "stock_minimo", length = 30)
    private String stockMinimo;

    @Column(name = "numero_lote", length = 50)
    private String numeroLote;

    @Column(name = "fecha_compra", length = 30)
    private String fechaCompra;

    @Column(name = "fecha_vencimiento", length = 30)
    private String fechaVencimiento;

    @Column(name = "cantidad", length = 30)
    private String cantidad;

    @Column(name = "precio_compra", length = 30)
    private String precioCompra;

    /** VALIDA, ERROR, IMPORTADA o FALLIDA. */
    @Column(name = "estado", nullable = false, length = 20)
    private String estado;

    /** Motivo del rechazo o resultado. */
    @Column(name = "mensaje", length = 1000)
    private String mensaje;

    /** Producto creado al importar. */
    @Column(name = "medicamento_id")
    private Long medicamentoId;
}
