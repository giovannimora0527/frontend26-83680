package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Despacho;
import com.uniminuto.clinica.entity.FormulaEstadoHistorial;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.models.DespachoRq;
import com.uniminuto.clinica.models.DispensacionRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PreparacionRs;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "16. Despacho y dispensación de medicamentos", description = "Exclusivo perfil DESPACHO_MEDICO")
@RequestMapping("/despacho")
public interface DespachoApi {

    @Operation(summary = "Fórmulas pendientes de despacho. Búsqueda por número, propietario, mascota, fecha o estado")
    @GetMapping(value = "/pendientes", produces = "application/json")
    ResponseEntity<List<FormulaMedica>> pendientes(
            @RequestParam(required = false) String numero,
            @RequestParam(required = false) String propietario,
            @RequestParam(required = false) String mascota,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) String estado);

    @Operation(summary = "Prepara el despacho (EN_PREPARACION): existencias, lotes, vencidos y sugerencia FEFO")
    @PostMapping(value = "/preparar", produces = "application/json")
    ResponseEntity<PreparacionRs> preparar(@RequestParam Long formulaId);

    @Operation(summary = "Confirma la entrega: descuenta inventario por lote en una transacción y genera movimientos")
    @PostMapping(value = "/confirmar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> confirmar(@RequestBody DespachoRq rq);

    @Operation(summary = "Marca la fórmula como pendiente por disponibilidad")
    @PatchMapping(value = "/pendiente-disponibilidad", produces = "application/json")
    ResponseEntity<MiRespuestaRS> pendienteDisponibilidad(@RequestParam Long formulaId,
                                                          @RequestParam(required = false) String observacion);

    @Operation(summary = "Cancela el despacho de una fórmula (procedimiento autorizado con motivo)")
    @PatchMapping(value = "/cancelar", produces = "application/json")
    ResponseEntity<MiRespuestaRS> cancelar(@RequestParam Long formulaId, @RequestParam String motivo);

    @Operation(summary = "Revierte una dispensación confirmada (devuelve unidades al lote con trazabilidad)")
    @PatchMapping(value = "/revertir", produces = "application/json")
    ResponseEntity<MiRespuestaRS> revertir(@RequestParam Long despachoId, @RequestParam String motivo);

    @Operation(summary = "Detalle de un despacho")
    @GetMapping(value = "/consultar", produces = "application/json")
    ResponseEntity<Despacho> consultar(@RequestParam Long despachoId);

    @Operation(summary = "Log de despachos de fórmulas (filtro por fechas y texto)")
    @GetMapping(value = "/historial", produces = "application/json")
    ResponseEntity<List<Despacho>> historial(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFinal,
            @RequestParam(required = false) String texto);

    @Operation(summary = "Despachos de una fórmula")
    @GetMapping(value = "/por-formula", produces = "application/json")
    ResponseEntity<List<Despacho>> porFormula(@RequestParam Long formulaId);

    @Operation(summary = "Historial de estados de despacho de una fórmula con usuario responsable")
    @GetMapping(value = "/estados", produces = "application/json")
    ResponseEntity<List<FormulaEstadoHistorial>> estados(@RequestParam Long formulaId);

    @Operation(summary = "Dispensaciones de un medicamento y su movimiento de inventario")
    @GetMapping(value = "/por-medicamento", produces = "application/json")
    ResponseEntity<List<DispensacionRs>> porMedicamento(@RequestParam Long medicamentoId);

    @Operation(summary = "Comprobante de despacho en PDF")
    @GetMapping(value = "/comprobante")
    ResponseEntity<byte[]> comprobante(@RequestParam Long despachoId);

    @Operation(summary = "Fórmula en PDF (consulta, sin modificar)")
    @GetMapping(value = "/formula-pdf")
    ResponseEntity<byte[]> formulaPdf(@RequestParam Long formulaId);
}
