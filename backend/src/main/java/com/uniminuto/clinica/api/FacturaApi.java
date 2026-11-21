package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Factura;
import com.uniminuto.clinica.entity.FacturaHistorial;
import com.uniminuto.clinica.models.FacturaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PagoRq;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Tag(name = "14. Facturación y pagos")
@RequestMapping("/factura")
public interface FacturaApi {

    @Operation(summary = "Citas atendidas sin factura vigente")
    @GetMapping(value = "/citas-por-facturar", produces = "application/json")
    ResponseEntity<List<Cita>> citasPorFacturar();

    @Operation(summary = "Vista previa de la factura de una cita (no se guarda)")
    @GetMapping(value = "/calcular", produces = "application/json")
    ResponseEntity<Factura> calcular(@RequestParam Long citaId,
                                     @RequestParam(required = false) BigDecimal porcentajeDescuento);

    @Operation(summary = "Genera la factura de una cita atendida (descuento sólo ADMIN)")
    @PostMapping(value = "/generar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> generar(@RequestBody FacturaRq rq);

    @Operation(summary = "Agrega a una factura pendiente los productos dispensados después de generarla")
    @PostMapping(value = "/agregar-dispensados", produces = "application/json")
    ResponseEntity<MiRespuestaRS> agregarDispensados(@RequestParam Long facturaId);

    @Operation(summary = "Registra un pago (parcial o total)")
    @PostMapping(value = "/pago", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> registrarPago(@RequestBody PagoRq rq);

    @Operation(summary = "Anula un pago con motivo (ADMIN)")
    @PatchMapping(value = "/pago/anular", produces = "application/json")
    ResponseEntity<MiRespuestaRS> anularPago(@RequestParam Long pagoId, @RequestParam String motivo);

    @Operation(summary = "Anula una factura sin pagos vigentes (ADMIN). Conserva los registros")
    @PatchMapping(value = "/anular", produces = "application/json")
    ResponseEntity<MiRespuestaRS> anular(@RequestParam Long facturaId, @RequestParam String motivo);

    @Operation(summary = "Lista facturas: por fechas/estado, o historial por propietario (clienteId) o mascota (mascotaId)")
    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<Factura>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFinal,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Integer mascotaId);

    @Operation(summary = "Detalle de una factura con pagos")
    @GetMapping(value = "/consultar", produces = "application/json")
    ResponseEntity<Factura> consultar(@RequestParam Long facturaId);

    @Operation(summary = "Trazabilidad de la factura")
    @GetMapping(value = "/historial", produces = "application/json")
    ResponseEntity<List<FacturaHistorial>> historial(@RequestParam Long facturaId);

    @Operation(summary = "Factura en PDF")
    @GetMapping(value = "/pdf")
    ResponseEntity<byte[]> pdf(@RequestParam Long facturaId);
}
