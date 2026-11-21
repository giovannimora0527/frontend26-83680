package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.DespachoApi;
import com.uniminuto.clinica.entity.Despacho;
import com.uniminuto.clinica.entity.FormulaEstadoHistorial;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.models.DespachoRq;
import com.uniminuto.clinica.models.DispensacionRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PreparacionRs;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.DespachoService;
import com.uniminuto.clinica.service.DocumentoService;
import com.uniminuto.clinica.utils.Descarga;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Regla 1 y 12: sólo DESPACHO_MEDICO gestiona despachos; se valida en el backend.
 * El historial (consulta) también lo puede ver el ADMIN para auditoría.
 */
@RestController
@RequiereRol(Roles.DESPACHO)
public class DespachoApiController implements DespachoApi {

    @Autowired
    private DespachoService despachoService;

    @Autowired
    private DocumentoService documentoService;

    @Override
    public ResponseEntity<List<FormulaMedica>> pendientes(String numero, String propietario, String mascota,
                                                          LocalDate fecha, String estado) {
        return ResponseEntity.ok(despachoService.bandeja(numero, propietario, mascota, fecha, estado));
    }

    @Override
    public ResponseEntity<PreparacionRs> preparar(Long formulaId) {
        return ResponseEntity.ok(despachoService.preparar(formulaId));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> confirmar(DespachoRq rq) {
        return ResponseEntity.status(201).body(despachoService.confirmar(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> pendienteDisponibilidad(Long formulaId, String observacion) {
        return ResponseEntity.ok(despachoService.marcarPendienteDisponibilidad(formulaId, observacion));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> cancelar(Long formulaId, String motivo) {
        return ResponseEntity.ok(despachoService.cancelar(formulaId, motivo));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> revertir(Long despachoId, String motivo) {
        return ResponseEntity.ok(despachoService.revertir(despachoId, motivo));
    }

    @Override
    @RequiereRol({Roles.DESPACHO, Roles.ADMIN})
    public ResponseEntity<Despacho> consultar(Long despachoId) {
        return ResponseEntity.ok(despachoService.consultar(despachoId));
    }

    @Override
    @RequiereRol({Roles.DESPACHO, Roles.ADMIN})
    public ResponseEntity<List<Despacho>> historial(LocalDate fechaInicial, LocalDate fechaFinal, String texto) {
        return ResponseEntity.ok(despachoService.historial(fechaInicial, fechaFinal, texto));
    }

    @Override
    @RequiereRol({Roles.DESPACHO, Roles.ADMIN})
    public ResponseEntity<List<Despacho>> porFormula(Long formulaId) {
        return ResponseEntity.ok(despachoService.despachosDeFormula(formulaId));
    }

    @Override
    @RequiereRol({Roles.DESPACHO, Roles.ADMIN})
    public ResponseEntity<List<FormulaEstadoHistorial>> estados(Long formulaId) {
        return ResponseEntity.ok(despachoService.historialEstados(formulaId));
    }

    @Override
    @RequiereRol({Roles.DESPACHO, Roles.ADMIN})
    public ResponseEntity<List<DispensacionRs>> porMedicamento(Long medicamentoId) {
        return ResponseEntity.ok(despachoService.dispensacionesPorMedicamento(medicamentoId));
    }

    @Override
    @RequiereRol({Roles.DESPACHO, Roles.ADMIN})
    public ResponseEntity<byte[]> comprobante(Long despachoId) {
        return Descarga.pdf(documentoService.comprobanteDespacho(despachoId), "comprobante_despacho_" + despachoId + ".pdf");
    }

    @Override
    public ResponseEntity<byte[]> formulaPdf(Long formulaId) {
        return Descarga.pdf(documentoService.formula(formulaId), "formula_" + formulaId + ".pdf");
    }
}
