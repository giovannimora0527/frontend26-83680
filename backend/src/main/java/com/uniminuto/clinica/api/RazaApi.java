package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.RazaRq;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Tag(name = "04. Razas")
@RequestMapping("/raza")
public interface RazaApi {

    @Operation(summary = "Lista las razas")
    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<Raza>> listarRazas();

    @Operation(summary = "Registra una raza")
    @PostMapping(value = "/guardar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> guardarRaza(@RequestBody RazaRq rq);

    @Operation(summary = "Actualiza una raza")
    @PutMapping(value = "/actualizar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> actualizarRaza(@RequestBody RazaRq rq);
}
