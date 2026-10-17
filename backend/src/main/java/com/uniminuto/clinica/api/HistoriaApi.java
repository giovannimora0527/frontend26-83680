package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.CitaDisponibleRs;
import com.uniminuto.clinica.models.HistoriaRq;
import com.uniminuto.clinica.models.HistoriaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.util.List;

/**
 * Servicios REST de historias clínicas: GET para consultar, POST para crear
 * y PUT para cerrarlas.
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/historia")
public interface HistoriaApi {

    /**
     * Lista las historias con paginación, orden y filtros (por defecto, de la
     * más reciente a la más antigua).
     *
     * @param page      página (empieza en 0).
     * @param size      registros por página (1 a 100).
     * @param orden     fecha, hora, cliente, mascota, medico, diagnostico o estado.
     * @param direccion asc o desc.
     * @param texto     texto libre.
     * @param estado    filtro por estado (ABIERTA o CERRADA).
     * @param clienteId filtro por cliente.
     * @param mascotaId filtro por mascota.
     * @param medicoId  filtro por veterinario.
     * @param desde     fecha inicial (yyyy-MM-dd).
     * @param hasta     fecha final (yyyy-MM-dd).
     * @return página de historias.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<PaginaRs<HistoriaRs>> listarHistorias(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String orden,
            @RequestParam(required = false) String direccion,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Integer mascotaId,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta);

    /**
     * Lista las citas atendidas de una mascota que todavía no tienen historia.
     *
     * @param mascotaId identificador de la mascota.
     * @return citas disponibles.
     */
    @GetMapping(value = "/citas-disponibles", produces = {"application/json"})
    ResponseEntity<List<CitaDisponibleRs>> listarCitasDisponibles(
            @RequestParam Integer mascotaId);

    /**
     * Consulta una historia clínica.
     *
     * @param historiaId identificador de la historia.
     * @return la historia (404 si no existe).
     */
    @GetMapping(value = "/{historiaId}", produces = {"application/json"})
    ResponseEntity<HistoriaRs> consultarHistoria(@PathVariable Long historiaId);

    /**
     * Crea una historia clínica.
     *
     * @param historiaRq datos de la historia.
     * @return mensaje de éxito con estado 201.
     */
    @PostMapping(value = "/guardar",
            produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarHistoria(@RequestBody HistoriaRq historiaRq);

    /**
     * Cierra una historia clínica: deja de admitir anotaciones.
     *
     * @param historiaId identificador de la historia.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{historiaId}/cerrar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> cerrarHistoria(@PathVariable Long historiaId);
}
