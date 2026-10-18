package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.CambioEstadoRq;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.CitaRs;
import com.uniminuto.clinica.models.PaginaRs;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

/**
 * Contrato REST de las citas médicas. Usa GET para consultar, POST para crear,
 * PUT para actualizar y PATCH para cambios parciales de estado.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/cita")
public interface CitaApi {

    /**
     * Lista las citas con paginación, filtros y ordenamiento. Por defecto: fecha y hora descendente.
     *
     * @param page       Página (desde 0).
     * @param size       Tamaño de página.
     * @param sortBy     Campo de orden.
     * @param sortDir    Dirección (asc/desc).
     * @param texto      Texto libre opcional.
     * @param estado     Estado opcional.
     * @param clienteId  Cliente opcional.
     * @param mascotaId  Mascota opcional.
     * @param medicoId   Veterinario opcional.
     * @param fechaDesde Fecha inicial opcional (yyyy-MM-dd).
     * @param fechaHasta Fecha final opcional (yyyy-MM-dd).
     * @return Página de citas.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<PaginaRs<CitaRs>> listarCitas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fechaHora") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Integer mascotaId,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta);

    /**
     * Consulta una cita.
     *
     * @param id Identificador de la cita.
     * @return La cita.
     */
    @GetMapping(value = "/obtener/{id}", produces = {"application/json"})
    ResponseEntity<CitaRs> obtenerCita(@PathVariable("id") Long id);

    /**
     * Crea una cita.
     *
     * @param rq Datos de la cita.
     * @return La cita creada (HTTP 201).
     */
    @PostMapping(value = "/crear", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<CitaRs> crearCita(@RequestBody CitaRq rq);

    /**
     * Actualiza una cita existente.
     *
     * @param id Identificador de la cita.
     * @param rq Nuevos datos.
     * @return La cita actualizada.
     */
    @PutMapping(value = "/actualizar/{id}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<CitaRs> actualizarCita(@PathVariable("id") Long id, @RequestBody CitaRq rq);

    /**
     * Cambia únicamente el estado de una cita.
     *
     * @param id Identificador de la cita.
     * @param rq Nuevo estado.
     * @return La cita actualizada.
     */
    @PatchMapping(value = "/cambiar-estado/{id}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<CitaRs> cambiarEstado(@PathVariable("id") Long id, @RequestBody CambioEstadoRq rq);

    /**
     * Reactiva una cita cancelada (operación explícita).
     *
     * @param id Identificador de la cita.
     * @return La cita reactivada en estado PENDIENTE.
     */
    @PatchMapping(value = "/reactivar/{id}", produces = {"application/json"})
    ResponseEntity<CitaRs> reactivarCita(@PathVariable("id") Long id);
}
