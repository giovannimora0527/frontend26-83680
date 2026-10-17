package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.AnotacionApi;
import com.uniminuto.clinica.models.AnotacionFiltroRq;
import com.uniminuto.clinica.models.AnotacionRq;
import com.uniminuto.clinica.models.AnotacionRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.service.AnotacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller de anotaciones: recibe la petición y delega en el servicio.
 */
@RestController
public class AnotacionApiController implements AnotacionApi {

    /**
     * Servicio con la lógica de las anotaciones.
     */
    @Autowired
    private AnotacionService anotacionService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<PaginaRs<AnotacionRs>> listarAnotaciones(
            Long historiaId, int page, int size, String orden, String direccion,
            String texto) {
        AnotacionFiltroRq filtro = new AnotacionFiltroRq();
        filtro.setHistoriaId(historiaId);
        filtro.setPage(page);
        filtro.setSize(size);
        filtro.setOrden(orden);
        filtro.setDireccion(direccion);
        filtro.setTexto(texto);
        return ResponseEntity.ok(anotacionService.listarAnotaciones(filtro));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<AnotacionRs> consultarAnotacion(Long anotacionId) {
        return ResponseEntity.ok(anotacionService.consultarAnotacion(anotacionId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> guardarAnotacion(AnotacionRq anotacionRq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(anotacionService.guardarAnotacion(anotacionRq));
    }
}
