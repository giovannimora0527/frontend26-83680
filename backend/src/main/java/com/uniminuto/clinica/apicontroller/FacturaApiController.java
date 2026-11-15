package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.FacturaApi;
import com.uniminuto.clinica.models.FacturaFiltroRq;
import com.uniminuto.clinica.models.FacturaRq;
import com.uniminuto.clinica.models.FacturaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MotivoRq;
import com.uniminuto.clinica.models.PagoRq;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.service.FacturaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller de facturación y pagos.
 */
@RestController
public class FacturaApiController implements FacturaApi {

    /** Servicio de facturación. */
    @Autowired
    private FacturaService facturaService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<FacturaRs>> porFacturar() {
        return ResponseEntity.ok(facturaService.porFacturar());
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<FacturaRs> vistaPrevia(Long historiaId) {
        return ResponseEntity.ok(facturaService.vistaPrevia(historiaId));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<FacturaRs> generar(FacturaRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facturaService.generar(rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<PaginaRs<FacturaRs>> listar(int page, int size, String texto, String estado, Long clienteId,
                                                      Integer mascotaId, LocalDate desde, LocalDate hasta) {
        FacturaFiltroRq f = new FacturaFiltroRq();
        f.setPage(page);
        f.setSize(size);
        f.setTexto(texto);
        f.setEstado(estado);
        f.setClienteId(clienteId);
        f.setMascotaId(mascotaId);
        f.setDesde(desde);
        f.setHasta(hasta);
        return ResponseEntity.ok(facturaService.listar(f));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<FacturaRs> consultar(Long facturaId) {
        return ResponseEntity.ok(facturaService.consultar(facturaId));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> registrarPago(Long facturaId, PagoRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facturaService.registrarPago(facturaId, rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> anular(Long facturaId, MotivoRq rq) {
        return ResponseEntity.ok(facturaService.anular(facturaId, rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<byte[]> descargarPdf(Long facturaId) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("factura-" + facturaId + ".pdf").build().toString())
                .body(facturaService.generarPdf(facturaId));
    }
}
