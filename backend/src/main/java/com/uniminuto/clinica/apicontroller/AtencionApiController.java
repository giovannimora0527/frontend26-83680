package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.AtencionApi;
import com.uniminuto.clinica.models.AtencionRs;
import com.uniminuto.clinica.models.HistoriaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.ServicioRq;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.AtencionService;
import com.uniminuto.clinica.service.DocumentoService;
import com.uniminuto.clinica.utils.Descarga;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiereRol(Roles.MEDICO)
public class AtencionApiController implements AtencionApi {

    @Autowired
    private AtencionService atencionService;

    @Autowired
    private DocumentoService documentoService;

    @Override
    public ResponseEntity<AtencionRs> consultar(Long citaId) {
        return ResponseEntity.ok(atencionService.consultar(citaId));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> iniciar(Long citaId) {
        return ResponseEntity.ok(atencionService.iniciar(citaId));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> guardarHistoria(HistoriaRq rq) {
        return ResponseEntity.ok(atencionService.guardarHistoria(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> agregarServicio(ServicioRq rq) {
        return ResponseEntity.status(201).body(atencionService.agregarServicio(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> quitarServicio(Long servicioId) {
        return ResponseEntity.ok(atencionService.quitarServicio(servicioId));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> finalizar(Long citaId) {
        return ResponseEntity.ok(atencionService.finalizar(citaId));
    }

    @Override
    @RequiereRol({Roles.MEDICO, Roles.ADMIN, Roles.RECEPCION})
    public ResponseEntity<byte[]> prefactura(Long citaId) {
        return Descarga.pdf(documentoService.prefactura(citaId), "prefactura_cita_" + citaId + ".pdf");
    }
}
