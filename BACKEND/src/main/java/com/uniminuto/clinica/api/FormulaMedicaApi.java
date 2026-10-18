package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.FormulaDetalleRs;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.FormulaRs;
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
 * Contrato REST de las fórmulas médicas. No existe DELETE: las fórmulas se inactivan.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/formula")
public interface FormulaMedicaApi {

    /**
     * Lista las fórmulas con paginación, filtros y orden (por defecto fecha de creación descendente).
     *
     * @param page          Página (desde 0).
     * @param size          Tamaño de página.
     * @param sortBy        Campo de orden.
     * @param sortDir       asc o desc.
     * @param texto         Texto libre opcional.
     * @param mascotaId     Mascota opcional.
     * @param medicoId      Veterinario opcional.
     * @param medicamentoId Medicamento opcional.
     * @param activa        Activa/inactiva opcional.
     * @param fechaDesde    Fecha de emisión inicial opcional (yyyy-MM-dd).
     * @param fechaHasta    Fecha de emisión final opcional (yyyy-MM-dd).
     * @return Página de fórmulas (resumen).
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<PaginaRs<FormulaRs>> listarFormulas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fechaCreacion") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Integer mascotaId,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) Long medicamentoId,
            @RequestParam(required = false) Boolean activa,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta);

    /**
     * Consulta el detalle completo de una fórmula.
     *
     * @param id Identificador de la fórmula.
     * @return Detalle de la fórmula.
     */
    @GetMapping(value = "/obtener/{id}", produces = {"application/json"})
    ResponseEntity<FormulaDetalleRs> obtenerFormula(@PathVariable("id") Long id);

    /**
     * Crea una fórmula médica.
     *
     * @param rq Datos de la fórmula.
     * @return Detalle de la fórmula creada (HTTP 201).
     */
    @PostMapping(value = "/crear", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<FormulaDetalleRs> crearFormula(@RequestBody FormulaRq rq);

    /**
     * Actualiza una fórmula activa.
     *
     * @param id Identificador de la fórmula.
     * @param rq Nuevos datos.
     * @return Detalle de la fórmula actualizada.
     */
    @PutMapping(value = "/actualizar/{id}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<FormulaDetalleRs> actualizarFormula(@PathVariable("id") Long id, @RequestBody FormulaRq rq);

    /**
     * Inactiva una fórmula (reemplaza a la eliminación física).
     *
     * @param id Identificador de la fórmula.
     * @return Detalle de la fórmula inactivada.
     */
    @PatchMapping(value = "/inactivar/{id}", produces = {"application/json"})
    ResponseEntity<FormulaDetalleRs> inactivarFormula(@PathVariable("id") Long id);
}
