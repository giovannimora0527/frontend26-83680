package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.MedicamentoApi;
import com.uniminuto.clinica.models.AjusteInventarioRq;
import com.uniminuto.clinica.models.LoteRq;
import com.uniminuto.clinica.models.MedicamentoRq;
import com.uniminuto.clinica.models.MedicamentoRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MovimientoRs;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.service.MedicamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller del inventario: recibe la petición y delega en el servicio.
 */
@RestController
public class MedicamentoApiController implements MedicamentoApi {

    /**
     * Servicio de inventario.
     */
    @Autowired
    private MedicamentoService medicamentoService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<MedicamentoRs>> listarMedicamentos(boolean soloActivos) {
        return ResponseEntity.ok(medicamentoService.listarMedicamentos(soloActivos));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MedicamentoRs> consultarMedicamento(Long id) {
        return ResponseEntity.ok(medicamentoService.consultarMedicamento(id));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> guardarMedicamento(MedicamentoRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicamentoService.guardarMedicamento(rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizarMedicamento(Long id, MedicamentoRq rq) {
        return ResponseEntity.ok(medicamentoService.actualizarMedicamento(id, rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> activarMedicamento(Long id) {
        return ResponseEntity.ok(medicamentoService.cambiarEstado(id, true));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> inactivarMedicamento(Long id) {
        return ResponseEntity.ok(medicamentoService.cambiarEstado(id, false));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> registrarLote(Long id, LoteRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicamentoService.registrarLote(id, rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> ajustarLote(Long loteId, AjusteInventarioRq rq) {
        return ResponseEntity.ok(medicamentoService.ajustarLote(loteId, rq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<PaginaRs<MovimientoRs>> listarMovimientos(Long id, int page, int size) {
        return ResponseEntity.ok(medicamentoService.listarMovimientos(id, page, size));
    }
}
