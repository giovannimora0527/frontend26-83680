package com.uniminuto.clinica.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Archivo de carga masiva de inventario (log de cargue): quién lo subió, cuándo,
 * cuántas filas eran válidas o tenían errores y cuántas se importaron.
 */
@Entity
@Table(name = "carga_inventario")
@Data
public class CargaInventario {

    /** Identificador. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "carga_id")
    private Long cargaId;

    /** Nombre del archivo. */
    @Column(name = "archivo", nullable = false, length = 200)
    private String archivo;

    /** XLSX o CSV. */
    @Column(name = "formato", nullable = false, length = 10)
    private String formato;

    /** Usuario que subió el archivo. */
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** Fecha de la validación. */
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    /** VALIDADA, CONFIRMADA o DESCARTADA. */
    @Column(name = "estado", nullable = false, length = 20)
    private String estado;

    /** Filas leídas. */
    @Column(name = "total_filas", nullable = false)
    private Integer totalFilas;

    /** Filas válidas. */
    @Column(name = "filas_validas", nullable = false)
    private Integer filasValidas;

    /** Filas con error. */
    @Column(name = "filas_error", nullable = false)
    private Integer filasError;

    /** Filas importadas. */
    @Column(name = "filas_importadas", nullable = false)
    private Integer filasImportadas = 0;

    /** Fecha de la confirmación. */
    @Column(name = "fecha_confirmacion")
    private LocalDateTime fechaConfirmacion;

    /** Filas del archivo. */
    @OneToMany(mappedBy = "carga", cascade = CascadeType.ALL)
    @OrderBy("fila")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<CargaInventarioDetalle> detalles = new ArrayList<>();
}
