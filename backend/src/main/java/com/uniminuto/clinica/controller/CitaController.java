package com.uniminuto.clinica.controller;

import com.uniminuto.clinica.dto.CitaDTO;
import com.uniminuto.clinica.dto.CitaRequest;
import com.uniminuto.clinica.service.CitaService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints REST para consulta, creación y actualización de citas. */
@RestController
@RequestMapping("/citas")
public class CitaController {
    private final CitaService service;
    /** Construye el controlador de citas. */
    public CitaController(CitaService service){this.service=service;}
    /** Lista citas; el filtro de fechas es opcional pero se deben enviar ambos extremos. */
    @GetMapping public List<CitaDTO> listar(@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate fechaInicial,@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate fechaFinal){return service.listar(fechaInicial,fechaFinal);}
    /** Consulta una cita por ID. */
    @GetMapping("/{id}") public CitaDTO obtener(@PathVariable Long id){return service.obtener(id);}
    /** Registra una cita nueva. */
    @PostMapping public ResponseEntity<CitaDTO> crear(@Valid @RequestBody CitaRequest request){return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(request));}
    /** Actualiza una cita sin permitir alterar registros cancelados o atendidos. */
    @PutMapping("/{id}") public CitaDTO actualizar(@PathVariable Long id,@Valid @RequestBody CitaRequest request){return service.actualizar(id,request);}
}
