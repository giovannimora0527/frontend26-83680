package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.CitaApi;
import com.uniminuto.clinica.models.CitaFiltroRq;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.CitaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.service.CitaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Controller de citas médicas. Solo recibe la petición y delega la lógica
 * en {@link CitaService}; los errores los convierte el GlobalExceptionHandler.
 */
@RestController
public class CitaApiController implements CitaApi {

    /**
     * Servicio con la lógica de negocio de las citas.
     */
    @Autowired
    private CitaService citaService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<PaginaRs<CitaRs>> listarCitas(
            int page, int size, String orden, String direccion, String texto,
            String estado, Long medicoId, Long clienteId, Integer mascotaId,
            LocalDate desde, LocalDate hasta) {
        CitaFiltroRq filtro = new CitaFiltroRq();
        filtro.setPage(page);
        filtro.setSize(size);
        filtro.setOrden(orden);
        filtro.setDireccion(direccion);
        filtro.setTexto(texto);
        filtro.setEstado(estado);
        filtro.setMedicoId(medicoId);
        filtro.setClienteId(clienteId);
        filtro.setMascotaId(mascotaId);
        filtro.setDesde(desde);
        filtro.setHasta(hasta);
        return ResponseEntity.ok(citaService.listarCitas(filtro));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<CitaRs> consultarCita(Long citaId) {
        return ResponseEntity.ok(citaService.consultarCita(citaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> guardarCita(CitaRq citaRq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(citaService.guardarCita(citaRq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizarCita(Long citaId, CitaRq citaRq) {
        return ResponseEntity.ok(citaService.actualizarCita(citaId, citaRq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> reactivarCita(Long citaId) {
        return ResponseEntity.ok(citaService.reactivarCita(citaId));
    }
}
