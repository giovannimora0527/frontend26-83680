package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Tag(name = "05. Mascotas (pacientes)")
@RequestMapping("/mascota")
public interface MascotaApi {

    @Operation(summary = "Lista las mascotas")
    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<Mascota>> listarMascotas();

    @Operation(summary = "Lista las mascotas ordenadas por nombre")
    @GetMapping(value = "/listar-ordenado", produces = "application/json")
    ResponseEntity<List<Mascota>> listarMascotasOrdenado(@RequestParam(defaultValue = "true") boolean ascendente);

    @Operation(summary = "Busca mascotas por nombre (contiene)")
    @GetMapping(value = "/buscar-nombre", produces = "application/json")
    ResponseEntity<List<Mascota>> buscarMascotaPorNombre(@RequestParam String nombre);

    @Operation(summary = "Mascotas de un cliente")
    @GetMapping(value = "/buscar-by-cliente", produces = "application/json")
    ResponseEntity<List<Mascota>> buscarMascotaPorCliente(@RequestParam Long clienteId);

    @Operation(summary = "Mascotas de una raza")
    @GetMapping(value = "/buscar-by-raza", produces = "application/json")
    ResponseEntity<List<Mascota>> buscarMascotaPorRaza(@RequestParam Integer razaId);

    @Operation(summary = "Consulta una mascota")
    @GetMapping(value = "/consultar", produces = "application/json")
    ResponseEntity<Mascota> consultar(@RequestParam Integer mascotaId);

    @Operation(summary = "Registra una mascota")
    @PostMapping(value = "/guardar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> guardarMascota(@RequestBody MascotaRq rq);

    @Operation(summary = "Actualiza una mascota")
    @PutMapping(value = "/actualizar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> actualizarMascota(@RequestBody MascotaRq rq);

    @Operation(summary = "Activa o inactiva una mascota")
    @PatchMapping(value = "/cambiar-estado", produces = "application/json")
    ResponseEntity<MiRespuestaRS> cambiarEstado(@RequestParam Integer mascotaId, @RequestParam boolean activo);
}
