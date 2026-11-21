package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.FormulaMedicaApi;
import com.uniminuto.clinica.entity.FormulaEstadoHistorial;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.DocumentoService;
import com.uniminuto.clinica.service.FormulaService;
import com.uniminuto.clinica.utils.Descarga;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Crear y confirmar fórmulas: sólo MEDICO. DESPACHO_MEDICO no puede crear ni
 * modificar fórmulas (sólo las consulta a través del módulo de despacho).
 */
@RestController
@RequiereRol(Roles.MEDICO)
public class FormulaMedicaApiController implements FormulaMedicaApi {

    @Autowired
    private FormulaService formulaService;

    @Autowired
    private DocumentoService documentoService;

    @Override
    @RequiereRol({Roles.MEDICO, Roles.ADMIN})
    public ResponseEntity<List<FormulaMedica>> listar() {
        return ResponseEntity.ok(formulaService.listar());
    }

    @Override
    @RequiereRol({Roles.MEDICO, Roles.ADMIN})
    public ResponseEntity<FormulaMedica> consultar(Long formulaId) {
        return ResponseEntity.ok(formulaService.consultar(formulaId));
    }

    @Override
    public ResponseEntity<List<FormulaMedica>> porCita(Long citaId) {
        return ResponseEntity.ok(formulaService.porCita(citaId));
    }

    @Override
    @RequiereRol({Roles.MEDICO, Roles.ADMIN})
    public ResponseEntity<List<FormulaEstadoHistorial>> historial(Long formulaId) {
        return ResponseEntity.ok(formulaService.historial(formulaId));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> guardar(FormulaRq rq) {
        return ResponseEntity.status(201).body(formulaService.guardar(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> actualizar(FormulaRq rq) {
        return ResponseEntity.ok(formulaService.actualizar(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> confirmar(Long formulaId) {
        return ResponseEntity.ok(formulaService.confirmar(formulaId));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> anular(Long formulaId, String motivo) {
        return ResponseEntity.ok(formulaService.anular(formulaId, motivo));
    }

    @Override
    @RequiereRol({Roles.MEDICO, Roles.ADMIN, Roles.DESPACHO})
    public ResponseEntity<byte[]> pdf(Long formulaId) {
        return Descarga.pdf(documentoService.formula(formulaId), "formula_" + formulaId + ".pdf");
    }
}
