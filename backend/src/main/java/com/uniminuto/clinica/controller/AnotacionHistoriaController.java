package com.uniminuto.clinica.controller;

import com.uniminuto.clinica.dto.AnotacionHistoriaDTO;
import com.uniminuto.clinica.dto.AnotacionHistoriaRequest;
import com.uniminuto.clinica.service.AnotacionHistoriaService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints generales para buscar y editar anotaciones clínicas. */
@RestController
@RequestMapping("/anotaciones-historia")
public class AnotacionHistoriaController {
    private final AnotacionHistoriaService service;
    /** Construye el controlador de anotaciones. */
    public AnotacionHistoriaController(AnotacionHistoriaService service){this.service=service;}
    /** Lista anotaciones ordenadas desde la más reciente y permite filtrar por fecha. */
    @GetMapping public List<AnotacionHistoriaDTO> listar(@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate fechaInicial,@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate fechaFinal){return service.listar(fechaInicial,fechaFinal);}
    /** Obtiene el detalle de una anotación. */
    @GetMapping("/{id}") public AnotacionHistoriaDTO obtener(@PathVariable Long id){return service.obtener(id);}
    /** Registra una anotación. */
    @PostMapping public ResponseEntity<AnotacionHistoriaDTO> crear(@Valid @RequestBody AnotacionHistoriaRequest request){return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(request));}
    /** Modifica una anotación conservando la integridad de su historia. */
    @PutMapping("/{id}") public AnotacionHistoriaDTO actualizar(@PathVariable Long id,@Valid @RequestBody AnotacionHistoriaRequest request){return service.actualizar(id,request);}
}
