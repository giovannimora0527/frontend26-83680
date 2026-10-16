package com.uniminuto.clinica.controller;

import com.uniminuto.clinica.dto.FormulaMedicaDTO;
import com.uniminuto.clinica.dto.FormulaMedicaRequest;
import com.uniminuto.clinica.service.FormulaMedicaService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints REST del módulo de fórmulas médicas. */
@RestController
@RequestMapping("/formulas-medicas")
public class FormulaMedicaController {
    private final FormulaMedicaService service;
    /** Construye el controlador de fórmulas. */
    public FormulaMedicaController(FormulaMedicaService service){this.service=service;}
    /** Lista fórmulas activas ordenadas por fecha de emisión descendente. */
    @GetMapping public List<FormulaMedicaDTO> listar(){return service.listar();}
    /** Obtiene el detalle completo de una fórmula. */
    @GetMapping("/{id}") public FormulaMedicaDTO obtener(@PathVariable Long id){return service.obtener(id);}
    /** Crea una fórmula y retorna HTTP 201. */
    @PostMapping public ResponseEntity<FormulaMedicaDTO> crear(@Valid @RequestBody FormulaMedicaRequest request){return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(request));}
    /** Actualiza los campos editables de una fórmula. */
    @PutMapping("/{id}") public FormulaMedicaDTO actualizar(@PathVariable Long id,@Valid @RequestBody FormulaMedicaRequest request){return service.actualizar(id,request);}
    /** Inactiva la fórmula sin eliminarla físicamente. */
    @PatchMapping("/{id}/inactivar") public ResponseEntity<Void> inactivar(@PathVariable Long id){service.inactivar(id);return ResponseEntity.noContent().build();}
}
