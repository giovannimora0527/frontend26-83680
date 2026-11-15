package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.CitaApi;
import com.uniminuto.clinica.models.CitaFiltroRq;
import com.uniminuto.clinica.entity.EstadoCitaCatalogo;
import com.uniminuto.clinica.models.CitaHistorialRs;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.CitaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.EstadoCitaRq;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.ReprogramarCitaRq;
import com.uniminuto.clinica.service.CitaService;
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
    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> cambiarEstado(Long citaId, EstadoCitaRq rq) {
        return ResponseEntity.ok(citaService.cambiarEstado(citaId, rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> reprogramarCita(Long citaId, ReprogramarCitaRq rq) {
        return ResponseEntity.ok(citaService.reprogramarCita(citaId, rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<CitaRs>> calendario(LocalDate desde, LocalDate hasta, Long medicoId) {
        return ResponseEntity.ok(citaService.calendario(desde, hasta, medicoId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<CitaHistorialRs>> historialCita(Long citaId) {
        return ResponseEntity.ok(citaService.historialCita(citaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<EstadoCitaCatalogo>> listarEstados() {
        return ResponseEntity.ok(citaService.listarEstados());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<byte[]> reporteExcel(LocalDate desde, LocalDate hasta, Long medicoId, String estado) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("citas-" + desde + "-a-" + hasta + ".xlsx").build().toString())
                .body(citaService.reporteExcel(desde, hasta, medicoId, estado));
    }
}
