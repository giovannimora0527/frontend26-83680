package com.uniminuto.clinica.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import com.uniminuto.clinica.entity.EstadoCitaCatalogo;
import com.uniminuto.clinica.models.CitaHistorialRs;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.CitaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.EstadoCitaRq;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.ReprogramarCitaRq;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
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
 * Servicios REST para la gestión de citas médicas.
 * GET para consultar, POST para crear y PUT para modificar.
 */
@Tag(name = "09. Citas", description = "Citas, calendario, cambios de estado, historial y reporte en Excel")
@RequestMapping("/cita")
public interface CitaApi {

    /**
     * Lista las citas con paginación, ordenamiento y filtros.
     * Por defecto ordena por fecha y hora de la cita, de la más reciente a la más antigua.
     *
     * @param page      página solicitada, empieza en 0.
     * @param size      registros por página (1 a 100).
     * @param orden     columna: fecha, hora, cliente, mascota, medico o estado.
     * @param direccion asc o desc.
     * @param texto     texto libre a buscar.
     * @param estado    filtro por estado.
     * @param medicoId  filtro por veterinario.
     * @param clienteId filtro por cliente.
     * @param mascotaId filtro por mascota.
     * @param desde     fecha inicial del rango (yyyy-MM-dd).
     * @param hasta     fecha final del rango (yyyy-MM-dd).
     * @return página de citas.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<PaginaRs<CitaRs>> listarCitas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String orden,
            @RequestParam(required = false) String direccion,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Integer mascotaId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta);

    /**
     * Consulta el detalle de una cita.
     *
     * @param citaId identificador de la cita.
     * @return la cita encontrada (404 si no existe).
     */
    @GetMapping(value = "/{citaId}", produces = {"application/json"})
    ResponseEntity<CitaRs> consultarCita(@PathVariable Long citaId);

    /**
     * Registra una nueva cita.
     *
     * @param citaRq datos de la cita.
     * @return mensaje de éxito con estado 201.
     */
    @PostMapping(value = "/guardar",
            produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarCita(@RequestBody CitaRq citaRq);

    /**
     * Modifica una cita existente.
     *
     * @param citaId identificador de la cita.
     * @param citaRq nuevos datos.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{citaId}",
            produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizarCita(
            @PathVariable Long citaId,
            @RequestBody CitaRq citaRq);

    /**
     * Reactiva una cita cancelada (operación explícita).
     *
     * @param citaId identificador de la cita cancelada.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{citaId}/reactivar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> reactivarCita(@PathVariable Long citaId);
    /**
     * Cambia el estado de una cita: confirmar, marcar como atendida o cancelar (con motivo).
     *
     * @param citaId identificador de la cita.
     * @param rq     estado nuevo y motivo.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{citaId}/estado", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> cambiarEstado(@PathVariable Long citaId, @RequestBody EstadoCitaRq rq);

    /**
     * Cambia la fecha y hora de una cita (por ejemplo, al arrastrarla en el calendario).
     *
     * @param citaId identificador de la cita.
     * @param rq     nueva fecha, hora de inicio y hora de fin.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{citaId}/reprogramar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> reprogramarCita(@PathVariable Long citaId, @RequestBody ReprogramarCitaRq rq);

    /**
     * Citas de un rango de fechas para el calendario (máximo 62 días). El
     * veterinario siempre recibe solo las suyas.
     *
     * @param desde    fecha inicial (yyyy-MM-dd).
     * @param hasta    fecha final, incluida (yyyy-MM-dd).
     * @param medicoId veterinario (administrador y recepción).
     * @return citas del rango.
     */
    @GetMapping(value = "/calendario", produces = {"application/json"})
    ResponseEntity<List<CitaRs>> calendario(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Long medicoId);

    /**
     * Historial de cambios de una cita (creación, reprogramaciones, estados).
     *
     * @param citaId identificador de la cita.
     * @return cambios registrados.
     */
    @GetMapping(value = "/{citaId}/historial", produces = {"application/json"})
    ResponseEntity<List<CitaHistorialRs>> historialCita(@PathVariable Long citaId);

    /**
     * Catálogo de estados de la cita con su color.
     *
     * @return estados.
     */
    @GetMapping(value = "/estados", produces = {"application/json"})
    ResponseEntity<List<EstadoCitaCatalogo>> listarEstados();

    /**
     * Reporte de citas en Excel (.xlsx) con hoja de detalle y resumen por estado.
     *
     * @param desde    fecha inicial (yyyy-MM-dd).
     * @param hasta    fecha final (yyyy-MM-dd).
     * @param medicoId veterinario (el veterinario siempre recibe las suyas).
     * @param estado   estado (opcional).
     * @return archivo Excel.
     */
    @GetMapping(value = "/reporte/excel",
            produces = {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/json"})
    ResponseEntity<byte[]> reporteExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) String estado);
}
