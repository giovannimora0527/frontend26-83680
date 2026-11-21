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
@Table(name = "medico")
@Data
public class Medico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    @Column(name = "tipo_documento", nullable = false, length = 10)
    private String tipoDocumento;
    @Column(name = "numero_documento", nullable = false, unique = true, length = 20)
    private String numeroDocumento;
    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;
    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;
    @Column(name = "telefono", length = 20)
    private String telefono;
    @Column(name = "email", length = 150)
    private String email;
    @Column(name = "registro_profesional", nullable = false, unique = true, length = 50)
    private String registroProfesional;
    @ManyToOne
    @JoinColumn(name = "especializacion_id", nullable = false)
    private Especializacion especializacion;
    /** true = activo, false = inactivo. */
    @Column(name = "estado", nullable = false)
    private Boolean estado;

    public String nombreCompleto() {
        return nombres + " " + apellidos;
    }
}
