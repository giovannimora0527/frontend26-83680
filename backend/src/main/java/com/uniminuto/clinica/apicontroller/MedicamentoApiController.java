package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.MedicamentoApi;
import com.uniminuto.clinica.entity.CargaMasiva;
import com.uniminuto.clinica.entity.LoteMedicamento;
import com.uniminuto.clinica.entity.MovimientoInventario;
import com.uniminuto.clinica.models.AlertasInventarioRs;
import com.uniminuto.clinica.models.CargaMasivaRs;
import com.uniminuto.clinica.models.LoteRq;
import com.uniminuto.clinica.models.MedicamentoRq;
import com.uniminuto.clinica.models.MedicamentoRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.CargaMasivaService;
import com.uniminuto.clinica.service.MedicamentoService;
import com.uniminuto.clinica.utils.Descarga;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

/**
 * Consulta: ADMIN, DESPACHO_MEDICO (sólo lectura) y MEDICO (disponibilidad).
 * Crear, editar, precios, lotes y carga masiva: sólo ADMIN.
 */
@RestController
@RequiereRol(Roles.ADMIN)
public class MedicamentoApiController implements MedicamentoApi {

    @Autowired
    private MedicamentoService medicamentoService;

    @Autowired
    private CargaMasivaService cargaMasivaService;

    @Override
    @RequiereRol({Roles.ADMIN, Roles.DESPACHO, Roles.MEDICO})
    public ResponseEntity<List<MedicamentoRs>> listar(String filtro, String texto) {
        return ResponseEntity.ok(medicamentoService.listar(filtro, texto));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.DESPACHO, Roles.MEDICO})
    public ResponseEntity<MedicamentoRs> consultar(Long medicamentoId) {
        return ResponseEntity.ok(medicamentoService.consultar(medicamentoId));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.DESPACHO, Roles.MEDICO})
    public ResponseEntity<AlertasInventarioRs> alertas() {
        return ResponseEntity.ok(medicamentoService.alertas());
    }

    @Override
    public ResponseEntity<MiRespuestaRS> crear(MedicamentoRq rq) {
        return ResponseEntity.status(201).body(medicamentoService.crear(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> actualizar(MedicamentoRq rq) {
        return ResponseEntity.ok(medicamentoService.actualizar(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> cambiarEstado(Long medicamentoId, boolean activo) {
        return ResponseEntity.ok(medicamentoService.cambiarEstado(medicamentoId, activo));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.DESPACHO, Roles.MEDICO})
    public ResponseEntity<List<LoteMedicamento>> lotes(Long medicamentoId, boolean soloConExistencia) {
        return ResponseEntity.ok(medicamentoService.lotes(medicamentoId, soloConExistencia));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> registrarLote(LoteRq rq) {
        return ResponseEntity.status(201).body(medicamentoService.registrarLote(rq));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.DESPACHO})
    public ResponseEntity<List<MovimientoInventario>> movimientos(Long medicamentoId, String tipo,
                                                                  LocalDate desde, LocalDate hasta) {
        return ResponseEntity.ok(medicamentoService.movimientos(medicamentoId, tipo, desde, hasta));
    }

    @Override
    public ResponseEntity<byte[]> plantilla() {
        return Descarga.excel(cargaMasivaService.plantilla(), "plantilla_carga_inventario.xlsx");
    }

    @Override
    public ResponseEntity<CargaMasivaRs> previsualizar(MultipartFile archivo) {
        return ResponseEntity.ok(cargaMasivaService.previsualizar(archivo));
    }

    @Override
    public ResponseEntity<CargaMasivaRs> confirmar(Long cargaId) {
        return ResponseEntity.ok(cargaMasivaService.confirmar(cargaId));
    }

    @Override
    public ResponseEntity<CargaMasivaRs> cancelar(Long cargaId) {
        return ResponseEntity.ok(cargaMasivaService.cancelar(cargaId));
    }

    @Override
    public ResponseEntity<CargaMasivaRs> detalle(Long cargaId) {
        return ResponseEntity.ok(cargaMasivaService.detalle(cargaId));
    }

    @Override
    public ResponseEntity<List<CargaMasiva>> historial() {
        return ResponseEntity.ok(cargaMasivaService.historial());
    }

    @Override
    public ResponseEntity<byte[]> reporteErrores(Long cargaId) {
        return Descarga.excel(cargaMasivaService.reporteErrores(cargaId), "errores_carga_" + cargaId + ".xlsx");
    }
}
