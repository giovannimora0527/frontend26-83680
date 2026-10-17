package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.HistoriaApi;
import com.uniminuto.clinica.models.CitaDisponibleRs;
import com.uniminuto.clinica.models.HistoriaFiltroRq;
import com.uniminuto.clinica.models.HistoriaRq;
import com.uniminuto.clinica.models.HistoriaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.service.HistoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller de historias clínicas: recibe la petición y delega en el servicio.
 */
@RestController
public class HistoriaApiController implements HistoriaApi {

    /**
     * Servicio con la lógica de las historias clínicas.
     */
    @Autowired
    private HistoriaService historiaService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<PaginaRs<HistoriaRs>> listarHistorias(
            int page, int size, String orden, String direccion, String texto,
            String estado, Long clienteId, Integer mascotaId, Long medicoId,
            LocalDate desde, LocalDate hasta) {
        HistoriaFiltroRq filtro = new HistoriaFiltroRq();
        filtro.setPage(page);
        filtro.setSize(size);
        filtro.setOrden(orden);
        filtro.setDireccion(direccion);
        filtro.setTexto(texto);
        filtro.setEstado(estado);
        filtro.setClienteId(clienteId);
        filtro.setMascotaId(mascotaId);
        filtro.setMedicoId(medicoId);
        filtro.setDesde(desde);
        filtro.setHasta(hasta);
        return ResponseEntity.ok(historiaService.listarHistorias(filtro));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<CitaDisponibleRs>> listarCitasDisponibles(
            Integer mascotaId) {
        return ResponseEntity.ok(historiaService.listarCitasDisponibles(mascotaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<HistoriaRs> consultarHistoria(Long historiaId) {
        return ResponseEntity.ok(historiaService.consultarHistoria(historiaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> guardarHistoria(HistoriaRq historiaRq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(historiaService.guardarHistoria(historiaRq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> cerrarHistoria(Long historiaId) {
        return ResponseEntity.ok(historiaService.cerrarHistoria(historiaId));
    }
}
