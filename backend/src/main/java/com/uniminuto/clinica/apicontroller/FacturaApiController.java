package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.FacturaApi;
import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Factura;
import com.uniminuto.clinica.entity.FacturaHistorial;
import com.uniminuto.clinica.models.FacturaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PagoRq;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.DocumentoService;
import com.uniminuto.clinica.service.FacturaService;
import com.uniminuto.clinica.utils.Descarga;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequiereRol({Roles.ADMIN, Roles.RECEPCION})
public class FacturaApiController implements FacturaApi {

    @Autowired
    private FacturaService facturaService;

    @Autowired
    private DocumentoService documentoService;

    @Override
    public ResponseEntity<List<Cita>> citasPorFacturar() {
        return ResponseEntity.ok(facturaService.citasPorFacturar());
    }

    @Override
    public ResponseEntity<Factura> calcular(Long citaId, BigDecimal porcentajeDescuento) {
        return ResponseEntity.ok(facturaService.calcular(citaId, porcentajeDescuento));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> generar(FacturaRq rq) {
        return ResponseEntity.status(201).body(facturaService.generar(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> agregarDispensados(Long facturaId) {
        return ResponseEntity.ok(facturaService.agregarDispensados(facturaId));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> registrarPago(PagoRq rq) {
        return ResponseEntity.status(201).body(facturaService.registrarPago(rq));
    }

    @Override
    @RequiereRol(Roles.ADMIN)
    public ResponseEntity<MiRespuestaRS> anularPago(Long pagoId, String motivo) {
        return ResponseEntity.ok(facturaService.anularPago(pagoId, motivo));
    }

    @Override
    @RequiereRol(Roles.ADMIN)
    public ResponseEntity<MiRespuestaRS> anular(Long facturaId, String motivo) {
        return ResponseEntity.ok(facturaService.anular(facturaId, motivo));
    }

    @Override
    public ResponseEntity<List<Factura>> listar(LocalDate fechaInicial, LocalDate fechaFinal, String estado,
                                                Long clienteId, Integer mascotaId) {
        return ResponseEntity.ok(facturaService.listar(fechaInicial, fechaFinal, estado, clienteId, mascotaId));
    }

    @Override
    public ResponseEntity<Factura> consultar(Long facturaId) {
        return ResponseEntity.ok(facturaService.consultar(facturaId));
    }

    @Override
    public ResponseEntity<List<FacturaHistorial>> historial(Long facturaId) {
        return ResponseEntity.ok(facturaService.historial(facturaId));
    }

    @Override
    public ResponseEntity<byte[]> pdf(Long facturaId) {
        return Descarga.pdf(documentoService.factura(facturaId), "factura_" + facturaId + ".pdf");
    }
}
