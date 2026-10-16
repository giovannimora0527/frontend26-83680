package com.uniminuto.clinica.controller;

import com.uniminuto.clinica.dto.AnotacionHistoriaDTO;
import com.uniminuto.clinica.dto.AnotacionHistoriaRequest;
import com.uniminuto.clinica.dto.HistoriaClinicaDTO;
import com.uniminuto.clinica.dto.HistoriaClinicaRequest;
import com.uniminuto.clinica.service.AnotacionHistoriaService;
import com.uniminuto.clinica.service.HistoriaClinicaService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints de historias clínicas y consulta del histórico de anotaciones. */
@RestController
@RequestMapping("/historias-clinicas")
public class HistoriaClinicaController {
    private final HistoriaClinicaService historias;
    private final AnotacionHistoriaService anotaciones;
    /** Construye el controlador de historias y anotaciones. */
    public HistoriaClinicaController(HistoriaClinicaService historias,AnotacionHistoriaService anotaciones){this.historias=historias;this.anotaciones=anotaciones;}
    /** Lista historias, opcionalmente limitadas por fecha de consulta. */
    @GetMapping public List<HistoriaClinicaDTO> listar(@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate fechaInicial,@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate fechaFinal){return historias.listar(fechaInicial,fechaFinal);}
    /** Consulta el detalle de una historia clínica. */
    @GetMapping("/{id}") public HistoriaClinicaDTO obtener(@PathVariable Long id){return historias.obtener(id);}
    /** Crea una historia asociada a una cita atendida. */
    @PostMapping public ResponseEntity<HistoriaClinicaDTO> crear(@Valid @RequestBody HistoriaClinicaRequest request){return ResponseEntity.status(HttpStatus.CREATED).body(historias.crear(request));}
    /** Lista las anotaciones de una historia, desde la más reciente. */
    @GetMapping("/{id}/anotaciones") public List<AnotacionHistoriaDTO> listarAnotaciones(@PathVariable Long id){return anotaciones.listarPorHistoria(id);}
    /** Agrega una anotación al histórico de la historia indicada. */
    @PostMapping("/{id}/anotaciones") public ResponseEntity<AnotacionHistoriaDTO> crearAnotacion(@PathVariable Long id,@Valid @RequestBody AnotacionHistoriaRequest request){if(!id.equals(request.historiaId())) throw new com.uniminuto.clinica.exception.BusinessException(HttpStatus.BAD_REQUEST,"El ID de la ruta y el ID de la historia del cuerpo deben coincidir.");return ResponseEntity.status(HttpStatus.CREATED).body(anotaciones.crear(request));}
}
