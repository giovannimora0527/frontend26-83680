package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.MedicoApi;
import com.uniminuto.clinica.entity.HorarioMedico;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.models.HorarioRq;
import com.uniminuto.clinica.models.MedicoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.MedicoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiereRol(Roles.ADMIN)
public class MedicoApiController implements MedicoApi {

    @Autowired
    private MedicoService medicoService;

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
    public ResponseEntity<List<Medico>> listarTodos(boolean soloActivos) {
        return ResponseEntity.ok(medicoService.listarMedicos(soloActivos));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
    public ResponseEntity<Medico> consultar(Long medicoId) {
        return ResponseEntity.ok(medicoService.consultar(medicoId));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
    public ResponseEntity<List<Medico>> listarMedicosDisponibles(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return ResponseEntity.ok(medicoService.listarMedicosDisponiblesPorFecha(fechaInicio, fechaFin));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> crearMedico(MedicoRq rq) {
        return ResponseEntity.status(201).body(medicoService.guardarMedico(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> actualizarMedico(MedicoRq rq) {
        return ResponseEntity.ok(medicoService.actualizarMedico(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> cambiarEstado(Long medicoId, boolean activo) {
        return ResponseEntity.ok(medicoService.cambiarEstado(medicoId, activo));
    }

    @Override
    @RequiereRol({Roles.ADMIN, Roles.RECEPCION, Roles.MEDICO})
    public ResponseEntity<List<HorarioMedico>> listarHorarios(Long medicoId) {
        return ResponseEntity.ok(medicoService.listarHorarios(medicoId));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> guardarHorarios(HorarioRq rq) {
        return ResponseEntity.ok(medicoService.guardarHorarios(rq));
    }
}
