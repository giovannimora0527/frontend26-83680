package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.AnotacionHistoriaApi;
import com.uniminuto.clinica.models.AnotacionRq;
import com.uniminuto.clinica.models.AnotacionRs;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.service.AnotacionHistoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Controlador REST de anotaciones. Delega toda la lógica en {@link AnotacionHistoriaService}.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@RestController
public class AnotacionHistoriaApiController implements AnotacionHistoriaApi {

    /** Servicio de anotaciones. */
    @Autowired
    private AnotacionHistoriaService anotacionService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<PaginaRs<AnotacionRs>> listarAnotaciones(int page, int size, String sortBy, String sortDir,
                                                                   String texto, Long historiaId, Integer mascotaId,
                                                                   Long medicoId, LocalDate fechaDesde,
                                                                   LocalDate fechaHasta) {
        return ResponseEntity.ok(anotacionService.listarAnotaciones(page, size, sortBy, sortDir, texto,
                historiaId, mascotaId, medicoId, fechaDesde, fechaHasta));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<AnotacionRs> obtenerAnotacion(Long id) {
        return ResponseEntity.ok(anotacionService.obtenerAnotacion(id));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<AnotacionRs> crearAnotacion(AnotacionRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(anotacionService.crearAnotacion(rq));
    }
}
