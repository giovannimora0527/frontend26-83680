package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.DespachoApi;
import com.uniminuto.clinica.models.DespachoFiltroRq;
import com.uniminuto.clinica.models.DespachoRq;
import com.uniminuto.clinica.models.DespachoRs;
import com.uniminuto.clinica.models.FormulaFiltroRq;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MotivoRq;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.PreparacionDespachoRs;
import com.uniminuto.clinica.service.DespachoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Controller del despacho de medicamentos: recibe la petición y delega en el servicio.
 */
@RestController
public class DespachoApiController implements DespachoApi {

    /**
     * Servicio con la lógica del despacho.
     */
    @Autowired
    private DespachoService despachoService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<PaginaRs<FormulaRs>> listarPendientes(int page, int size, String orden, String direccion,
                                                                String texto, String estadoDespacho,
                                                                Long medicamentoId, LocalDate desde, LocalDate hasta) {
        FormulaFiltroRq filtro = new FormulaFiltroRq();
        filtro.setPage(page);
        filtro.setSize(size);
        filtro.setOrden(orden);
        filtro.setDireccion(direccion);
        filtro.setTexto(texto);
        filtro.setEstadoDespacho(estadoDespacho);
        filtro.setMedicamentoId(medicamentoId);
        filtro.setDesde(desde);
        filtro.setHasta(hasta);
        return ResponseEntity.ok(despachoService.listarPendientes(filtro));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<PreparacionDespachoRs> consultarPreparacion(Long formulaId) {
        return ResponseEntity.ok(despachoService.consultarPreparacion(formulaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> iniciarPreparacion(Long formulaId) {
        return ResponseEntity.ok(despachoService.iniciarPreparacion(formulaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<DespachoRs> confirmarEntrega(Long formulaId, DespachoRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(despachoService.confirmarEntrega(formulaId, rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> marcarSinDisponibilidad(Long formulaId, MotivoRq rq) {
        return ResponseEntity.ok(despachoService.marcarSinDisponibilidad(formulaId, rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> cancelarDespacho(Long formulaId, MotivoRq rq) {
        return ResponseEntity.ok(despachoService.cancelarDespacho(formulaId, rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> revertirEntrega(Long despachoId, MotivoRq rq) {
        return ResponseEntity.ok(despachoService.revertirEntrega(despachoId, rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<PaginaRs<DespachoRs>> listarHistorial(int page, int size, String texto, String estado,
                                                                Long medicamentoId, LocalDate desde, LocalDate hasta) {
        DespachoFiltroRq filtro = new DespachoFiltroRq();
        filtro.setPage(page);
        filtro.setSize(size);
        filtro.setTexto(texto);
        filtro.setEstado(estado);
        filtro.setMedicamentoId(medicamentoId);
        filtro.setDesde(desde);
        filtro.setHasta(hasta);
        return ResponseEntity.ok(despachoService.listarHistorial(filtro));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<byte[]> descargarComprobante(Long despachoId) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("despacho-" + despachoId + ".pdf").build().toString())
                .body(despachoService.generarComprobante(despachoId));
    }
}
