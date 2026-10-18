package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.FormulaMedicaApi;
import com.uniminuto.clinica.models.FormulaDetalleRs;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.service.FormulaMedicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Controlador REST de fórmulas médicas. Delega toda la lógica en {@link FormulaMedicaService}.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@RestController
public class FormulaMedicaApiController implements FormulaMedicaApi {

    /** Servicio de fórmulas médicas. */
    @Autowired
    private FormulaMedicaService formulaService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<PaginaRs<FormulaRs>> listarFormulas(int page, int size, String sortBy, String sortDir,
                                                              String texto, Integer mascotaId, Long medicoId,
                                                              Long medicamentoId, Boolean activa,
                                                              LocalDate fechaDesde, LocalDate fechaHasta) {
        return ResponseEntity.ok(formulaService.listarFormulas(page, size, sortBy, sortDir, texto, mascotaId,
                medicoId, medicamentoId, activa, fechaDesde, fechaHasta));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<FormulaDetalleRs> obtenerFormula(Long id) {
        return ResponseEntity.ok(formulaService.obtenerFormula(id));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<FormulaDetalleRs> crearFormula(FormulaRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(formulaService.crearFormula(rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<FormulaDetalleRs> actualizarFormula(Long id, FormulaRq rq) {
        return ResponseEntity.ok(formulaService.actualizarFormula(id, rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<FormulaDetalleRs> inactivarFormula(Long id) {
        return ResponseEntity.ok(formulaService.inactivarFormula(id));
    }
}
