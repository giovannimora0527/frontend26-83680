package com.uniminuto.clinica.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import com.uniminuto.clinica.models.FacturaRq;
import com.uniminuto.clinica.models.FacturaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MotivoRq;
import com.uniminuto.clinica.models.PagoRq;
import com.uniminuto.clinica.models.PaginaRs;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.util.List;

/**
 * Servicios REST de facturación y pagos (administración y recepción).
 */
@Tag(name = "18. Facturación", description = "Facturas, pagos, anulación y PDF")
@RequestMapping("/factura")
public interface FacturaApi {

    /**
     * Atenciones finalizadas que aún no tienen factura, con su valor calculado.
     *
     * @return atenciones por facturar.
     */
    @GetMapping(value = "/por-facturar", produces = {"application/json"})
    ResponseEntity<List<FacturaRs>> porFacturar();

    /**
     * Vista previa de la factura de una atención.
     *
     * @param historiaId atención.
     * @return factura calculada sin guardar.
     */
    @GetMapping(value = "/vista-previa/{historiaId}", produces = {"application/json"})
    ResponseEntity<FacturaRs> vistaPrevia(@PathVariable Long historiaId);

    /**
     * Genera la factura de una atención (201).
     *
     * @param rq atención, descuento y motivo.
     * @return factura generada.
     */
    @PostMapping(value = "/generar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<FacturaRs> generar(@RequestBody FacturaRq rq);

    /**
     * Lista facturas (historial por propietario o por mascota).
     *
     * @param page      página.
     * @param size      registros por página.
     * @param texto     número, propietario, documento o mascota.
     * @param estado    PENDIENTE_PAGO, PAGO_PARCIAL, PAGADA o ANULADA.
     * @param clienteId propietario.
     * @param mascotaId mascota.
     * @param desde     fecha inicial.
     * @param hasta     fecha final.
     * @return página de facturas.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<PaginaRs<FacturaRs>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Integer mascotaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta);

    /**
     * Consulta una factura con líneas y pagos.
     *
     * @param facturaId factura.
     * @return factura.
     */
    @GetMapping(value = "/{facturaId}", produces = {"application/json"})
    ResponseEntity<FacturaRs> consultar(@PathVariable Long facturaId);

    /**
     * Registra un pago (201).
     *
     * @param facturaId factura.
     * @param rq        valor, medio y referencia.
     * @return mensaje de éxito.
     */
    @PostMapping(value = "/{facturaId}/pagos", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> registrarPago(@PathVariable Long facturaId, @RequestBody PagoRq rq);

    /**
     * Anula una factura sin pagos (solo administrador).
     *
     * @param facturaId factura.
     * @param rq        motivo.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{facturaId}/anular", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> anular(@PathVariable Long facturaId, @RequestBody MotivoRq rq);

    /**
     * Factura en PDF.
     *
     * @param facturaId factura.
     * @return documento PDF.
     */
    @GetMapping(value = "/{facturaId}/pdf", produces = {"application/pdf", "application/json"})
    ResponseEntity<byte[]> descargarPdf(@PathVariable Long facturaId);
}
