package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.CitaApi;
import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.CitaHistorial;
import com.uniminuto.clinica.entity.EstadoCita;
import com.uniminuto.clinica.models.CambioEstadoRq;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.CitaService;
import com.uniminuto.clinica.utils.Descarga;
import com.uniminuto.clinica.utils.ReporteRenderer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
public class CitaApiController implements CitaApi {

    @Autowired
    private CitaService citaService;

    @Autowired
    private ReporteRenderer renderer;

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION})
    public ResponseEntity<List<Cita>> listarCitas(LocalDate fechaInicial, LocalDate fechaFinal, Long medicoId, String estado) {
        return ResponseEntity.ok(citaService.listarCitas(fechaInicial, fechaFinal, medicoId, estado));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION})
    public ResponseEntity<List<Cita>> listarCitasRango(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return ResponseEntity.ok(citaService.listarCitasRango(fechaInicio, fechaFin));
    }

    @Override
    @RequiereRol(Roles.MEDICO)
    public ResponseEntity<List<Cita>> agenda(LocalDateTime inicio, LocalDateTime fin) {
        return ResponseEntity.ok(citaService.agendaMedico(inicio, fin));
    }

    @Override
    public ResponseEntity<Cita> consultar(Long citaId) {
        return ResponseEntity.ok(citaService.consultar(citaId));
    }

    @Override
    public ResponseEntity<List<Cita>> listarCitasPorMascota(Integer mascotaId) {
        return ResponseEntity.ok(citaService.listarCitasPorMascota(mascotaId));
    }

    @Override
    public ResponseEntity<List<CitaHistorial>> historial(Long citaId) {
        return ResponseEntity.ok(citaService.historial(citaId));
    }

    @Override
    public ResponseEntity<List<EstadoCita>> estados() {
        return ResponseEntity.ok(citaService.estados());
    }

    @Override
    public ResponseEntity<Map<String, Long>> resumenEstados(LocalDate fechaInicial, LocalDate fechaFinal) {
        return ResponseEntity.ok(citaService.resumenEstados(fechaInicial, fechaFinal));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> crearCita(CitaRq rq) {
        return ResponseEntity.status(201).body(citaService.crearCita(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> actualizarCita(CitaRq rq) {
        return ResponseEntity.ok(citaService.actualizarCita(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> reprogramar(CambioEstadoRq rq) {
        return ResponseEntity.ok(citaService.reprogramar(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> cambiarEstado(CambioEstadoRq rq) {
        return ResponseEntity.ok(citaService.cambiarEstado(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> reactivar(Long citaId) {
        return ResponseEntity.ok(citaService.reactivar(citaId));
    }

    @Override
    public ResponseEntity<byte[]> reporteExcel(LocalDate fechaInicial, LocalDate fechaFinal, Long medicoId) {
        return Descarga.excel(renderer.excel(citaService.reporteCitasMedico(fechaInicial, fechaFinal, medicoId)),
                "citas_" + fechaInicial + "_" + fechaFinal + ".xlsx");
    }

    @Override
    public ResponseEntity<byte[]> reportePdf(LocalDate fechaInicial, LocalDate fechaFinal, Long medicoId) {
        return Descarga.pdf(renderer.pdf(citaService.reporteCitasMedico(fechaInicial, fechaFinal, medicoId)),
                "citas_" + fechaInicial + "_" + fechaFinal + ".pdf");
    }
}
