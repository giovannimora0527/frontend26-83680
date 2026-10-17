package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.FormulaApi;
import com.uniminuto.clinica.models.FormulaFiltroRq;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.service.FormulaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Controller de fórmulas médicas: recibe la petición y delega en el servicio.
 */
@RestController
public class FormulaApiController implements FormulaApi {

    /**
     * Servicio con la lógica de las fórmulas.
     */
    @Autowired
    private FormulaService formulaService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<PaginaRs<FormulaRs>> listarFormulas(
            int page, int size, String orden, String direccion, String texto, String estado,
            Long medicoId, Long medicamentoId, Integer mascotaId, Long historiaId,
            LocalDate desde, LocalDate hasta) {
        FormulaFiltroRq filtro = new FormulaFiltroRq();
        filtro.setPage(page);
        filtro.setSize(size);
        filtro.setOrden(orden);
        filtro.setDireccion(direccion);
        filtro.setTexto(texto);
        filtro.setEstado(estado);
        filtro.setMedicoId(medicoId);
        filtro.setMedicamentoId(medicamentoId);
        filtro.setMascotaId(mascotaId);
        filtro.setHistoriaId(historiaId);
        filtro.setDesde(desde);
        filtro.setHasta(hasta);
        return ResponseEntity.ok(formulaService.listarFormulas(filtro));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<FormulaRs> consultarFormula(Long formulaId) {
        return ResponseEntity.ok(formulaService.consultarFormula(formulaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> guardarFormula(FormulaRq formulaRq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(formulaService.guardarFormula(formulaRq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizarFormula(Long formulaId, FormulaRq formulaRq) {
        return ResponseEntity.ok(formulaService.actualizarFormula(formulaId, formulaRq));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> inactivarFormula(Long formulaId) {
        return ResponseEntity.ok(formulaService.inactivarFormula(formulaId));
    }
}
