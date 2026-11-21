package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.CitaHistorial;
import com.uniminuto.clinica.entity.EstadoCita;
import com.uniminuto.clinica.models.CambioEstadoRq;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Tag(name = "10. Citas médicas y calendario")
@RequestMapping("/cita")
public interface CitaApi {

    @Operation(summary = "Lista citas (módulo de recepción). Filtros opcionales: fechas, veterinario, estado")
    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<Cita>> listarCitas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFinal,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) String estado);

    @Operation(summary = "Citas en un rango de fecha-hora (ISO)")
    @GetMapping(value = "/listar-rango", produces = "application/json")
    ResponseEntity<List<Cita>> listarCitasRango(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin);

    @Operation(summary = "Calendario: citas del veterinario autenticado (perfil MEDICO) entre inicio y fin")
    @GetMapping(value = "/agenda", produces = "application/json")
    ResponseEntity<List<Cita>> agenda(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin);

    @Operation(summary = "Consulta una cita")
    @GetMapping(value = "/consultar", produces = "application/json")
    ResponseEntity<Cita> consultar(@RequestParam Long citaId);

    @Operation(summary = "Historial de citas de una mascota")
    @GetMapping(value = "/listar-por-mascota", produces = "application/json")
    ResponseEntity<List<Cita>> listarCitasPorMascota(@RequestParam Integer mascotaId);

    @Operation(summary = "Trazabilidad de una cita (creación, cambios de estado, reprogramaciones)")
    @GetMapping(value = "/historial", produces = "application/json")
    ResponseEntity<List<CitaHistorial>> historial(@RequestParam Long citaId);

    @Operation(summary = "Catálogo de estados de cita con su color")
    @GetMapping(value = "/estados", produces = "application/json")
    ResponseEntity<List<EstadoCita>> estados();

    @Operation(summary = "Conteo de citas por estado (MEDICO: sólo las suyas)")
    @GetMapping(value = "/resumen-estados", produces = "application/json")
    ResponseEntity<Map<String, Long>> resumenEstados(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFinal);

    @Operation(summary = "Registra una cita (valida horario, superposición y estado del veterinario)")
    @PostMapping(value = "/crear", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> crearCita(@RequestBody CitaRq rq);

    @Operation(summary = "Edita una cita (no aplica a atendidas, canceladas o en atención)")
    @PutMapping(value = "/actualizar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> actualizarCita(@RequestBody CitaRq rq);

    @Operation(summary = "Cambia fecha/hora (arrastrar y soltar en el calendario)")
    @PatchMapping(value = "/reprogramar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> reprogramar(@RequestBody CambioEstadoRq rq);

    @Operation(summary = "Cambia el estado: PENDIENTE, PROGRAMADA, CONFIRMADA o CANCELADA (con motivo)")
    @PatchMapping(value = "/cambiar-estado", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> cambiarEstado(@RequestBody CambioEstadoRq rq);

    @Operation(summary = "Reactiva una cita cancelada (vuelve a validar el horario)")
    @PatchMapping(value = "/reactivar", produces = "application/json")
    ResponseEntity<MiRespuestaRS> reactivar(@RequestParam Long citaId);

    @Operation(summary = "Reporte Excel de citas del veterinario entre fechas (MEDICO: las propias)")
    @GetMapping(value = "/reporte-excel")
    ResponseEntity<byte[]> reporteExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicial,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFinal,
            @RequestParam(required = false) Long medicoId);

    @Operation(summary = "Reporte PDF de citas del veterinario entre fechas")
    @GetMapping(value = "/reporte-pdf")
    ResponseEntity<byte[]> reportePdf(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicial,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFinal,
            @RequestParam(required = false) Long medicoId);
}
