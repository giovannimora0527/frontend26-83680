package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.AnotacionRq;
import com.uniminuto.clinica.models.AnotacionRs;
import com.uniminuto.clinica.models.PaginaRs;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

/**
 * Contrato REST de las anotaciones de historia clínica.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/anotacion")
public interface AnotacionHistoriaApi {

    /**
     * Lista anotaciones con paginación, filtros y orden (por defecto la más reciente primero).
     * Se consulta por historia clínica (historiaId) o por todo el histórico de una mascota (mascotaId).
     *
     * @param page       Página (desde 0).
     * @param size       Tamaño de página.
     * @param sortBy     Campo de orden (fecha, medico).
     * @param sortDir    asc o desc.
     * @param texto      Texto libre opcional.
     * @param historiaId Historia clínica opcional.
     * @param mascotaId  Mascota opcional.
     * @param medicoId   Veterinario opcional.
     * @param fechaDesde Fecha inicial opcional (yyyy-MM-dd).
     * @param fechaHasta Fecha final opcional (yyyy-MM-dd).
     * @return Página de anotaciones.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<PaginaRs<AnotacionRs>> listarAnotaciones(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fecha") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Long historiaId,
            @RequestParam(required = false) Integer mascotaId,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta);

    /**
     * Consulta el detalle de una anotación.
     *
     * @param id Identificador de la anotación.
     * @return La anotación.
     */
    @GetMapping(value = "/obtener/{id}", produces = {"application/json"})
    ResponseEntity<AnotacionRs> obtenerAnotacion(@PathVariable("id") Long id);

    /**
     * Agrega una anotación a una historia clínica abierta.
     *
     * @param rq Datos de la anotación.
     * @return La anotación creada (HTTP 201).
     */
    @PostMapping(value = "/crear", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<AnotacionRs> crearAnotacion(@RequestBody AnotacionRq rq);
}
