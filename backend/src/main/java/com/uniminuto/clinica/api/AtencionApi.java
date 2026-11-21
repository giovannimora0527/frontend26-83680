package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.AtencionRs;
import com.uniminuto.clinica.models.HistoriaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.ServicioRq;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "11. Atención médica", description = "Iniciar, registrar historia y servicios, finalizar, prefactura PDF")
@RequestMapping("/atencion")
public interface AtencionApi {

    @Operation(summary = "Datos de la atención: cita, mascota, propietario, historia, servicios, fórmulas y antecedentes")
    @GetMapping(value = "/cita", produces = "application/json")
    ResponseEntity<AtencionRs> consultar(@RequestParam Long citaId);

    @Operation(summary = "Inicia la atención (cita EN_ATENCION + historia ABIERTA) - MEDICO de la cita")
    @PostMapping(value = "/iniciar", produces = "application/json")
    ResponseEntity<MiRespuestaRS> iniciar(@RequestParam Long citaId);

    @Operation(summary = "Guarda motivo, síntomas, diagnóstico, observaciones y recomendaciones")
    @PutMapping(value = "/historia", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> guardarHistoria(@RequestBody HistoriaRq rq);

    @Operation(summary = "Agrega un servicio prestado (tarifa). No admite el mismo servicio dos veces")
    @PostMapping(value = "/servicio", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> agregarServicio(@RequestBody ServicioRq rq);

    @Operation(summary = "Retira un servicio mientras la atención está abierta")
    @DeleteMapping(value = "/servicio", produces = "application/json")
    ResponseEntity<MiRespuestaRS> quitarServicio(@RequestParam Long servicioId);

    @Operation(summary = "Finaliza la atención: historia CERRADA y cita ATENDIDA")
    @PostMapping(value = "/finalizar", produces = "application/json")
    ResponseEntity<MiRespuestaRS> finalizar(@RequestParam Long citaId);

    @Operation(summary = "Prefactura PDF con servicios prestados y medicamentos formulados")
    @GetMapping(value = "/prefactura")
    ResponseEntity<byte[]> prefactura(@RequestParam Long citaId);
}
