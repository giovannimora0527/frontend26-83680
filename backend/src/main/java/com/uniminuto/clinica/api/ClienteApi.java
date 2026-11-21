package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.models.ClienteRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Tag(name = "03. Clientes (propietarios)")
@RequestMapping("/cliente")
public interface ClienteApi {

    @Operation(summary = "Lista los clientes")
    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<Cliente>> listarClientes();

    @Operation(summary = "Consulta un cliente por id")
    @GetMapping(value = "/consultar", produces = "application/json")
    ResponseEntity<Cliente> consultar(@RequestParam Long clienteId);

    @Operation(summary = "Busca un cliente por número de documento")
    @GetMapping(value = "/buscar-por-documento", produces = "application/json")
    ResponseEntity<Cliente> buscarClientesPorDocumento(@RequestParam String documento);

    @Operation(summary = "Registra un cliente")
    @PostMapping(value = "/guardar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> guardar(@RequestBody ClienteRq rq);

    @Operation(summary = "Actualiza un cliente")
    @PutMapping(value = "/actualizar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> actualizar(@RequestBody ClienteRq rq);

    @Operation(summary = "Activa o inactiva un cliente")
    @PatchMapping(value = "/cambiar-estado", produces = "application/json")
    ResponseEntity<MiRespuestaRS> cambiarEstado(@RequestParam Long clienteId, @RequestParam boolean activo);
}
