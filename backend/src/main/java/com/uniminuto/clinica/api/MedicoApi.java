package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.HorarioMedico;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.models.HorarioRq;
import com.uniminuto.clinica.models.MedicoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Tag(name = "07. Veterinarios y horarios de disponibilidad")
@RequestMapping("/medico")
public interface MedicoApi {

    @Operation(summary = "Lista los veterinarios (soloActivos=true para asignar citas)")
    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<Medico>> listarTodos(@RequestParam(defaultValue = "false") boolean soloActivos);

    @Operation(summary = "Consulta un veterinario")
    @GetMapping(value = "/consultar", produces = "application/json")
    ResponseEntity<Medico> consultar(@RequestParam Long medicoId);

    @Operation(summary = "Veterinarios activos sin citas en el rango (ISO yyyy-MM-ddTHH:mm:ss)")
    @GetMapping(value = "/listar-disponibles", produces = "application/json")
    ResponseEntity<List<Medico>> listarMedicosDisponibles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin);

    @Operation(summary = "Registra un veterinario (ADMIN)")
    @PostMapping(value = "/crear", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> crearMedico(@RequestBody MedicoRq rq);

    @Operation(summary = "Actualiza un veterinario (ADMIN)")
    @PutMapping(value = "/actualizar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> actualizarMedico(@RequestBody MedicoRq rq);

    @Operation(summary = "Activa o inactiva un veterinario (ADMIN). No permite inactivar con citas futuras")
    @PatchMapping(value = "/cambiar-estado", produces = "application/json")
    ResponseEntity<MiRespuestaRS> cambiarEstado(@RequestParam Long medicoId, @RequestParam boolean activo);

    @Operation(summary = "Horarios de disponibilidad del veterinario")
    @GetMapping(value = "/horarios", produces = "application/json")
    ResponseEntity<List<HorarioMedico>> listarHorarios(@RequestParam Long medicoId);

    @Operation(summary = "Reemplaza los horarios de disponibilidad (ADMIN)")
    @PutMapping(value = "/horarios", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> guardarHorarios(@RequestBody HorarioRq rq);
}
