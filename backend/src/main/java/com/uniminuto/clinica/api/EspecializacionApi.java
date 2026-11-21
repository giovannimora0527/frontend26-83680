package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.models.EspecializacionRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Tag(name = "06. Especialidades")
@RequestMapping("/especializacion")
public interface EspecializacionApi {

    @Operation(summary = "Lista las especialidades (soloActivas=true para combos)")
    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<Especializacion>> listarEspecializaciones(@RequestParam(defaultValue = "false") boolean soloActivas);

    @Operation(summary = "Crea una especialidad (ADMIN)")
    @PostMapping(value = "/crear", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> crearEspecializacion(@RequestBody EspecializacionRq rq);

    @Operation(summary = "Actualiza una especialidad (ADMIN)")
    @PutMapping(value = "/actualizar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> actualizarEspecializacion(@RequestBody EspecializacionRq rq);

    @Operation(summary = "Activa o inactiva una especialidad (ADMIN)")
    @PatchMapping(value = "/cambiar-estado", produces = "application/json")
    ResponseEntity<MiRespuestaRS> cambiarEstado(@RequestParam Long id, @RequestParam boolean activo);
}
