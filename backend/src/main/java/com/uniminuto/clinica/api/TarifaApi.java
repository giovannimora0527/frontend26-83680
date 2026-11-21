package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Impuesto;
import com.uniminuto.clinica.entity.Tarifa;
import com.uniminuto.clinica.entity.TarifaHistorial;
import com.uniminuto.clinica.models.ImpuestoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.TarifaRq;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "08. Tarifas e impuestos", description = "Módulo administrativo de valores de consultas y servicios")
@RequestMapping("/tarifa")
public interface TarifaApi {

    @Operation(summary = "Lista las tarifas (soloActivas=true para atención/facturación)")
    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<Tarifa>> listar(@RequestParam(defaultValue = "false") boolean soloActivas);

    @Operation(summary = "Consulta una tarifa")
    @GetMapping(value = "/consultar", produces = "application/json")
    ResponseEntity<Tarifa> consultar(@RequestParam Long tarifaId);

    @Operation(summary = "Crea una tarifa (ADMIN)")
    @PostMapping(value = "/crear", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> crear(@RequestBody TarifaRq rq);

    @Operation(summary = "Actualiza una tarifa (ADMIN). Registra el cambio en el log de tarifas")
    @PutMapping(value = "/actualizar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> actualizar(@RequestBody TarifaRq rq);

    @Operation(summary = "Activa o inactiva una tarifa (ADMIN)")
    @PatchMapping(value = "/cambiar-estado", produces = "application/json")
    ResponseEntity<MiRespuestaRS> cambiarEstado(@RequestParam Long tarifaId, @RequestParam boolean activo);

    @Operation(summary = "Log (historial) de cambios de tarifas; tarifaId opcional")
    @GetMapping(value = "/historial", produces = "application/json")
    ResponseEntity<List<TarifaHistorial>> historial(@RequestParam(required = false) Long tarifaId);

    @Operation(summary = "Lista los impuestos configurados")
    @GetMapping(value = "/impuestos", produces = "application/json")
    ResponseEntity<List<Impuesto>> listarImpuestos();

    @Operation(summary = "Crea un impuesto (ADMIN)")
    @PostMapping(value = "/impuestos", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> crearImpuesto(@RequestBody ImpuestoRq rq);

    @Operation(summary = "Actualiza un impuesto (ADMIN)")
    @PutMapping(value = "/impuestos", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> actualizarImpuesto(@RequestBody ImpuestoRq rq);

    @Operation(summary = "Activa o inactiva un impuesto (ADMIN)")
    @PatchMapping(value = "/impuestos/cambiar-estado", produces = "application/json")
    ResponseEntity<MiRespuestaRS> cambiarEstadoImpuesto(@RequestParam Long id, @RequestParam boolean activo);
}
