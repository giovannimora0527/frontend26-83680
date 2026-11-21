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
@Table(name = "menu")
@Data
public class Menu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_id")
    private Integer menuId;
    @Column(name = "code", nullable = false, length = 100)
    private String code;
    @Column(name = "title", nullable = false)
    private String title;
    @Column(name = "url", nullable = false, columnDefinition = "LONGTEXT")
    private String url;
    @Column(name = "icon", nullable = false)
    private String icon;
    @Column(name = "orden", nullable = false)
    private Integer orden;
    @Column(name = "activo", nullable = false)
    private Boolean activo;
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;
}
