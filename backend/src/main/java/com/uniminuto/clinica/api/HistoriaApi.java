package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.AnotacionHistoriaRq;
import com.uniminuto.clinica.models.HistoriaMedicaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "12. Historias clínicas")
@RequestMapping("/historia-clinica")
public interface HistoriaApi {

    @Operation(summary = "Lista historias clínicas con anotaciones (soloPropias=true para el veterinario)")
    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<HistoriaMedicaRs>> listar(@RequestParam(defaultValue = "false") boolean soloPropias);

    @Operation(summary = "Antecedentes médicos de una mascota")
    @GetMapping(value = "/por-mascota", produces = "application/json")
    ResponseEntity<List<HistoriaMedicaRs>> porMascota(@RequestParam Integer mascotaId);

    @Operation(summary = "Consulta una historia clínica")
    @GetMapping(value = "/consultar", produces = "application/json")
    ResponseEntity<HistoriaMedicaRs> consultar(@RequestParam Long historiaId);

    @Operation(summary = "Agrega una anotación de evolución (MEDICO)")
    @PostMapping(value = "/anotacion", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> agregarAnotacion(@RequestBody AnotacionHistoriaRq rq);
}
