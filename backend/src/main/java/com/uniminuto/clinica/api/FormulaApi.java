package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.FormulaRs;
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

/**
 * Servicios REST de fórmulas médicas: GET para consultar, POST para crear y
 * PUT para editar o inactivar (no hay DELETE: una fórmula no se elimina).
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/formula")
public interface FormulaApi {

    /**
     * Lista las fórmulas con paginación, orden y filtros. Por defecto ordena
     * por fecha de creación descendente (las más recientes primero).
     *
     * @param page          página (empieza en 0).
     * @param size          registros por página (1 a 100).
     * @param orden         creacion, emision, mascota, cliente, medicamento, medico o estado.
     * @param direccion     asc o desc.
     * @param texto         texto libre.
     * @param estado        ACTIVA o INACTIVA.
     * @param medicoId      veterinario.
     * @param medicamentoId medicamento.
     * @param mascotaId     mascota.
     * @param historiaId    historia clínica.
     * @param desde         fecha de emisión inicial (yyyy-MM-dd).
     * @param hasta         fecha de emisión final (yyyy-MM-dd).
     * @return página de fórmulas.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<PaginaRs<FormulaRs>> listarFormulas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String orden,
            @RequestParam(required = false) String direccion,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) Long medicamentoId,
            @RequestParam(required = false) Integer mascotaId,
            @RequestParam(required = false) Long historiaId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta);

    /**
     * Consulta el detalle completo de una fórmula.
     *
     * @param formulaId identificador de la fórmula.
     * @return la fórmula (404 si no existe).
     */
    @GetMapping(value = "/{formulaId}", produces = {"application/json"})
    ResponseEntity<FormulaRs> consultarFormula(@PathVariable Long formulaId);

    /**
     * Registra una fórmula nueva.
     *
     * @param formulaRq datos de la fórmula.
     * @return mensaje de éxito con estado 201.
     */
    @PostMapping(value = "/guardar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarFormula(@RequestBody FormulaRq formulaRq);

    /**
     * Modifica los datos del tratamiento de una fórmula activa.
     *
     * @param formulaId identificador de la fórmula.
     * @param formulaRq nuevos datos.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{formulaId}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizarFormula(@PathVariable Long formulaId,
                                                    @RequestBody FormulaRq formulaRq);

    /**
     * Inactiva una fórmula.
     *
     * @param formulaId identificador de la fórmula.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{formulaId}/inactivar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> inactivarFormula(@PathVariable Long formulaId);
}
