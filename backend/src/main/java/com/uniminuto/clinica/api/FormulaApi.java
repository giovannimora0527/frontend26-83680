package com.uniminuto.clinica.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MotivoRq;
import com.uniminuto.clinica.models.PaginaRs;
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

/**
 * Servicios REST de fórmulas médicas. Una fórmula no se elimina: se anula con motivo.
 */
@Tag(name = "15. Fórmulas médicas", description = "Fórmulas con varios medicamentos, confirmación, anulación y PDF")
@RequestMapping("/formula")
public interface FormulaApi {

    /**
     * Lista las fórmulas con paginación, orden y filtros (por defecto, las más recientes primero).
     *
     * @param page           página (empieza en 0).
     * @param size           registros por página (1 a 100).
     * @param orden          creacion, numero, emision, mascota, cliente, medico, estado o despacho.
     * @param direccion      asc o desc.
     * @param texto          texto libre (mascota, propietario, médico, medicamento o número).
     * @param estado         BORRADOR, CONFIRMADA o ANULADA.
     * @param estadoDespacho estado del despacho.
     * @param medicoId       veterinario.
     * @param medicamentoId  medicamento incluido en la fórmula.
     * @param mascotaId      mascota.
     * @param historiaId     historia clínica.
     * @param desde          fecha de emisión inicial (yyyy-MM-dd).
     * @param hasta          fecha de emisión final (yyyy-MM-dd).
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
            @RequestParam(required = false) String estadoDespacho,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) Long medicamentoId,
            @RequestParam(required = false) Integer mascotaId,
            @RequestParam(required = false) Long historiaId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta);

    /**
     * Consulta el detalle de una fórmula con sus líneas, historial y entregas.
     *
     * @param formulaId identificador de la fórmula.
     * @return la fórmula (404 si no existe).
     */
    @GetMapping(value = "/{formulaId}", produces = {"application/json"})
    ResponseEntity<FormulaRs> consultarFormula(@PathVariable Long formulaId);

    /**
     * Registra una fórmula como borrador o confirmada (campo confirmar).
     *
     * @param formulaRq datos de la fórmula.
     * @return mensaje de éxito con estado 201.
     */
    @PostMapping(value = "/guardar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarFormula(@RequestBody FormulaRq formulaRq);

    /**
     * Modifica una fórmula en borrador.
     *
     * @param formulaId identificador de la fórmula.
     * @param formulaRq nuevos datos.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{formulaId}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizarFormula(@PathVariable Long formulaId,
                                                    @RequestBody FormulaRq formulaRq);

    /**
     * Confirma una fórmula en borrador para que pase a despacho.
     *
     * @param formulaId identificador de la fórmula.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{formulaId}/confirmar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> confirmarFormula(@PathVariable Long formulaId);

    /**
     * Anula una fórmula sin entregas confirmadas.
     *
     * @param formulaId identificador de la fórmula.
     * @param rq        motivo de la anulación.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{formulaId}/anular", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> anularFormula(@PathVariable Long formulaId, @RequestBody MotivoRq rq);

    /**
     * Descarga la fórmula en PDF.
     *
     * @param formulaId identificador de la fórmula.
     * @return documento PDF.
     */
    @GetMapping(value = "/{formulaId}/pdf", produces = {"application/pdf"})
    ResponseEntity<byte[]> descargarPdf(@PathVariable Long formulaId);
}
