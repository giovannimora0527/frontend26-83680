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
@Table(name = "carga_masiva")
@Data
public class CargaMasiva {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @Column(name = "nombre_archivo", nullable = false)
    private String nombreArchivo;
    @Column(name = "tipo_archivo", nullable = false, length = 10)
    private String tipoArchivo;
    @Column(name = "estado", nullable = false, length = 20)
    private String estado;
    @Column(name = "total_registros", nullable = false)
    private Integer totalRegistros;
    @Column(name = "registros_validos", nullable = false)
    private Integer registrosValidos;
    @Column(name = "registros_error", nullable = false)
    private Integer registrosError;
    @Column(name = "registros_importados", nullable = false)
    private Integer registrosImportados;
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    @Column(name = "fecha_carga", nullable = false)
    private LocalDateTime fechaCarga;
    @ManyToOne
    @JoinColumn(name = "usuario_confirma_id")
    private Usuario usuarioConfirma;
    @Column(name = "fecha_confirmacion")
    private LocalDateTime fechaConfirmacion;
}
