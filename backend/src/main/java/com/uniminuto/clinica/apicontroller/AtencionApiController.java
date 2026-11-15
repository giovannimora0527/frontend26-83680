package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.AtencionApi;
import com.uniminuto.clinica.models.AgendaAtencionRs;
import com.uniminuto.clinica.models.AtencionRq;
import com.uniminuto.clinica.models.AtencionRs;
import com.uniminuto.clinica.models.AtencionServicioRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.service.AtencionService;
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
 * Controller de la atención médica.
 */
@RestController
public class AtencionApiController implements AtencionApi {

    /** Servicio de atención. */
    @Autowired
    private AtencionService atencionService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<AgendaAtencionRs>> agenda(LocalDate fecha) {
        return ResponseEntity.ok(atencionService.agenda(fecha));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<AtencionRs> iniciar(Long citaId) {
        return ResponseEntity.ok(atencionService.iniciar(citaId));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<AtencionRs> consultar(Long historiaId) {
        return ResponseEntity.ok(atencionService.consultar(historiaId));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> guardar(Long historiaId, AtencionRq rq) {
        return ResponseEntity.ok(atencionService.guardar(historiaId, rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> agregarServicio(Long historiaId, AtencionServicioRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(atencionService.agregarServicio(historiaId, rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> quitarServicio(Long historiaId, Long atencionServicioId) {
        return ResponseEntity.ok(atencionService.quitarServicio(historiaId, atencionServicioId));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> finalizar(Long historiaId) {
        return ResponseEntity.ok(atencionService.finalizar(historiaId));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<byte[]> prefactura(Long historiaId) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("prefactura-" + historiaId + ".pdf").build().toString())
                .body(atencionService.prefactura(historiaId));
    }
}
