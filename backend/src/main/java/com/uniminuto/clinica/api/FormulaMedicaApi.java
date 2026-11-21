package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.FormulaEstadoHistorial;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "13. Fórmulas médicas", description = "Formulación (no descuenta inventario) y PDF")
@RequestMapping("/formula-medica")
public interface FormulaMedicaApi {

    @Operation(summary = "Lista fórmulas (MEDICO: las propias)")
    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<FormulaMedica>> listar();

    @Operation(summary = "Detalle de una fórmula")
    @GetMapping(value = "/consultar", produces = "application/json")
    ResponseEntity<FormulaMedica> consultar(@RequestParam Long formulaId);

    @Operation(summary = "Fórmulas de una cita")
    @GetMapping(value = "/por-cita", produces = "application/json")
    ResponseEntity<List<FormulaMedica>> porCita(@RequestParam Long citaId);

    @Operation(summary = "Historial de estados de la fórmula (formulación y despacho)")
    @GetMapping(value = "/historial", produces = "application/json")
    ResponseEntity<List<FormulaEstadoHistorial>> historial(@RequestParam Long formulaId);

    @Operation(summary = "Crea una fórmula en BORRADOR durante la atención (calcula cantidades y advierte faltantes)")
    @PostMapping(value = "/guardar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> guardar(@RequestBody FormulaRq rq);

    @Operation(summary = "Edita una fórmula en BORRADOR")
    @PutMapping(value = "/actualizar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> actualizar(@RequestBody FormulaRq rq);

    @Operation(summary = "Confirma la fórmula y la envía a despacho (PENDIENTE_DESPACHO)")
    @PostMapping(value = "/confirmar", produces = "application/json")
    ResponseEntity<MiRespuestaRS> confirmar(@RequestParam Long formulaId);

    @Operation(summary = "Anula una fórmula sin dispensaciones (no se elimina)")
    @PatchMapping(value = "/anular", produces = "application/json")
    ResponseEntity<MiRespuestaRS> anular(@RequestParam Long formulaId, @RequestParam String motivo);

    @Operation(summary = "Imprime la fórmula en PDF")
    @GetMapping(value = "/pdf")
    ResponseEntity<byte[]> pdf(@RequestParam Long formulaId);
}
