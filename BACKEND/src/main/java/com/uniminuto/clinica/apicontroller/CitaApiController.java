package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.CitaApi;
import com.uniminuto.clinica.models.CambioEstadoRq;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.CitaRs;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.service.CitaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Controlador REST de las citas. Solo recibe la petición y delega toda la lógica en {@link CitaService}.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@RestController
public class CitaApiController implements CitaApi {

    /** Servicio con la lógica de negocio de citas. */
    @Autowired
    private CitaService citaService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<PaginaRs<CitaRs>> listarCitas(int page, int size, String sortBy, String sortDir,
                                                        String texto, String estado, Long clienteId,
                                                        Integer mascotaId, Long medicoId,
                                                        LocalDate fechaDesde, LocalDate fechaHasta) {
        return ResponseEntity.ok(citaService.listarCitas(page, size, sortBy, sortDir, texto, estado,
                clienteId, mascotaId, medicoId, fechaDesde, fechaHasta));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<CitaRs> obtenerCita(Long id) {
        return ResponseEntity.ok(citaService.obtenerCita(id));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<CitaRs> crearCita(CitaRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(citaService.crearCita(rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<CitaRs> actualizarCita(Long id, CitaRq rq) {
        return ResponseEntity.ok(citaService.actualizarCita(id, rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<CitaRs> cambiarEstado(Long id, CambioEstadoRq rq) {
        return ResponseEntity.ok(citaService.cambiarEstado(id, rq == null ? null : rq.getEstado()));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<CitaRs> reactivarCita(Long id) {
        return ResponseEntity.ok(citaService.reactivarCita(id));
    }
}
