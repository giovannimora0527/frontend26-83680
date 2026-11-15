package com.uniminuto.clinica.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import com.uniminuto.clinica.models.DespachoRq;
import com.uniminuto.clinica.models.DespachoRs;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MotivoRq;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.PreparacionDespachoRs;
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
 * Servicios REST del despacho de medicamentos (perfil DESPACHO_MEDICO).
 */
@Tag(name = "16. Despacho", description = "Despacho y dispensación de medicamentos (perfil DESPACHO_MEDICO)")
@RequestMapping("/despacho")
public interface DespachoApi {

    /**
     * Lista las fórmulas confirmadas con medicamentos por entregar (las más antiguas primero).
     *
     * @param page           página.
     * @param size           registros por página.
     * @param orden          confirmacion, emision o numero.
     * @param direccion      asc o desc.
     * @param texto          texto libre.
     * @param estadoDespacho estado del despacho.
     * @param medicamentoId  medicamento incluido.
     * @param desde          fecha de emisión inicial.
     * @param hasta          fecha de emisión final.
     * @return página de fórmulas pendientes.
     */
    @GetMapping(value = "/pendientes", produces = {"application/json"})
    ResponseEntity<PaginaRs<FormulaRs>> listarPendientes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String orden,
            @RequestParam(required = false) String direccion,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) String estadoDespacho,
            @RequestParam(required = false) Long medicamentoId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta);

    /**
     * Consulta lo pendiente por línea y los lotes sugeridos (vencimiento más próximo primero).
     *
     * @param formulaId identificador de la fórmula.
     * @return información de preparación.
     */
    @GetMapping(value = "/formula/{formulaId}", produces = {"application/json"})
    ResponseEntity<PreparacionDespachoRs> consultarPreparacion(@PathVariable Long formulaId);

    /**
     * Marca la fórmula como en preparación.
     *
     * @param formulaId identificador de la fórmula.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/formula/{formulaId}/preparar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> iniciarPreparacion(@PathVariable Long formulaId);

    /**
     * Confirma una entrega total o parcial y descuenta el inventario.
     *
     * @param formulaId identificador de la fórmula.
     * @param rq        unidades por línea y lote.
     * @return la entrega registrada (201).
     */
    @PostMapping(value = "/formula/{formulaId}/entregar", produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<DespachoRs> confirmarEntrega(@PathVariable Long formulaId, @RequestBody DespachoRq rq);

    /**
     * Marca la fórmula como pendiente por disponibilidad.
     *
     * @param formulaId identificador de la fórmula.
     * @param rq        observación opcional.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/formula/{formulaId}/sin-disponibilidad", produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> marcarSinDisponibilidad(@PathVariable Long formulaId, @RequestBody MotivoRq rq);

    /**
     * Cancela el despacho de una fórmula sin entregas.
     *
     * @param formulaId identificador de la fórmula.
     * @param rq        motivo.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/formula/{formulaId}/cancelar", produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> cancelarDespacho(@PathVariable Long formulaId, @RequestBody MotivoRq rq);

    /**
     * Revierte una entrega confirmada.
     *
     * @param despachoId identificador de la entrega.
     * @param rq         motivo.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{despachoId}/revertir", produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> revertirEntrega(@PathVariable Long despachoId, @RequestBody MotivoRq rq);

    /**
     * Historial de entregas, de la más reciente a la más antigua.
     *
     * @param page          página.
     * @param size          registros por página.
     * @param texto         texto libre (mascota, propietario, usuario o número).
     * @param estado        CONFIRMADO o REVERTIDO.
     * @param medicamentoId medicamento entregado.
     * @param desde         fecha inicial.
     * @param hasta         fecha final.
     * @return página de entregas.
     */
    @GetMapping(value = "/historial", produces = {"application/json"})
    ResponseEntity<PaginaRs<DespachoRs>> listarHistorial(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long medicamentoId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta);

    /**
     * Descarga el comprobante de una entrega en PDF.
     *
     * @param despachoId identificador de la entrega.
     * @return documento PDF.
     */
    @GetMapping(value = "/{despachoId}/comprobante", produces = {"application/pdf"})
    ResponseEntity<byte[]> descargarComprobante(@PathVariable Long despachoId);
}
