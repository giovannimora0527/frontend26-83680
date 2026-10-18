package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.HistoriaClinicaDetalleRs;
import com.uniminuto.clinica.models.HistoriaClinicaRq;
import com.uniminuto.clinica.models.HistoriaClinicaRs;
import com.uniminuto.clinica.models.PaginaRs;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

/**
 * Contrato REST de las historias clínicas.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/historia")
public interface HistoriaClinicaApi {

    /**
     * Lista las historias con paginación, filtros y orden (por defecto fecha descendente).
     *
     * @param page       Página (desde 0).
     * @param size       Tamaño de página.
     * @param sortBy     Campo de orden.
     * @param sortDir    asc o desc.
     * @param texto      Texto libre opcional.
     * @param estado     Estado opcional.
     * @param clienteId  Cliente opcional.
     * @param mascotaId  Mascota opcional.
     * @param medicoId   Veterinario opcional.
     * @param fechaDesde Fecha inicial opcional (yyyy-MM-dd).
     * @param fechaHasta Fecha final opcional (yyyy-MM-dd).
     * @return Página de historias (resumen).
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<PaginaRs<HistoriaClinicaRs>> listarHistorias(
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
     * Consulta el detalle completo de una historia.
     *
     * @param id Identificador de la historia.
     * @return Detalle de la historia.
     */
    @GetMapping(value = "/obtener/{id}", produces = {"application/json"})
    ResponseEntity<HistoriaClinicaDetalleRs> obtenerHistoria(@PathVariable("id") Long id);

    /**
     * Crea una historia clínica a partir de una cita atendida.
     *
     * @param rq Datos de la historia.
     * @return Detalle de la historia creada (HTTP 201).
     */
    @PostMapping(value = "/crear", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<HistoriaClinicaDetalleRs> crearHistoria(@RequestBody HistoriaClinicaRq rq);

    /**
     * Cierra una historia clínica.
     *
     * @param id Identificador de la historia.
     * @return Detalle de la historia cerrada.
     */
    @PatchMapping(value = "/cerrar/{id}", produces = {"application/json"})
    ResponseEntity<HistoriaClinicaDetalleRs> cerrarHistoria(@PathVariable("id") Long id);
}
