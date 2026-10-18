package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.HistoriaClinicaApi;
import com.uniminuto.clinica.models.HistoriaClinicaDetalleRs;
import com.uniminuto.clinica.models.HistoriaClinicaRq;
import com.uniminuto.clinica.models.HistoriaClinicaRs;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.service.HistoriaClinicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Controlador REST de historias clínicas. Delega toda la lógica en {@link HistoriaClinicaService}.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@RestController
public class HistoriaClinicaApiController implements HistoriaClinicaApi {

    /** Servicio de historias clínicas. */
    @Autowired
    private HistoriaClinicaService historiaService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<PaginaRs<HistoriaClinicaRs>> listarHistorias(int page, int size, String sortBy,
                                                                       String sortDir, String texto, String estado,
                                                                       Long clienteId, Integer mascotaId,
                                                                       Long medicoId, LocalDate fechaDesde,
                                                                       LocalDate fechaHasta) {
        return ResponseEntity.ok(historiaService.listarHistorias(page, size, sortBy, sortDir, texto, estado,
                clienteId, mascotaId, medicoId, fechaDesde, fechaHasta));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<HistoriaClinicaDetalleRs> obtenerHistoria(Long id) {
        return ResponseEntity.ok(historiaService.obtenerHistoria(id));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<HistoriaClinicaDetalleRs> crearHistoria(HistoriaClinicaRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(historiaService.crearHistoria(rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<HistoriaClinicaDetalleRs> cerrarHistoria(Long id) {
        return ResponseEntity.ok(historiaService.cerrarHistoria(id));
    }
}
