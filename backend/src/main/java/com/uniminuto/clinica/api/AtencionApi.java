package com.uniminuto.clinica.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import com.uniminuto.clinica.models.AgendaAtencionRs;
import com.uniminuto.clinica.models.AtencionRq;
import com.uniminuto.clinica.models.AtencionRs;
import com.uniminuto.clinica.models.AtencionServicioRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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
 * Servicios REST de la atención médica (perfil VETERINARIO).
 */
@Tag(name = "14. Atención médica", description = "Atención de la cita, servicios prestados, finalización y prefactura")
@RequestMapping("/atencion")
public interface AtencionApi {

    /**
     * Agenda del veterinario de la sesión: citas del día y atenciones abiertas.
     *
     * @param fecha día (yyyy-MM-dd; por defecto hoy).
     * @return citas con el estado de su atención.
     */
    @GetMapping(value = "/agenda", produces = {"application/json"})
    ResponseEntity<List<AgendaAtencionRs>> agenda(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha);

    /**
     * Inicia la atención de una cita (o devuelve la ya iniciada).
     *
     * @param citaId cita.
     * @return la atención.
     */
    @PostMapping(value = "/iniciar/{citaId}", produces = {"application/json"})
    ResponseEntity<AtencionRs> iniciar(@PathVariable Long citaId);

    /**
     * Consulta una atención con antecedentes, servicios y fórmulas.
     *
     * @param historiaId atención.
     * @return la atención.
     */
    @GetMapping(value = "/{historiaId}", produces = {"application/json"})
    ResponseEntity<AtencionRs> consultar(@PathVariable Long historiaId);

    /**
     * Guarda motivo, síntomas, diagnóstico, observaciones y recomendaciones.
     *
     * @param historiaId atención.
     * @param rq         datos clínicos.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{historiaId}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardar(@PathVariable Long historiaId, @RequestBody AtencionRq rq);

    /**
     * Agrega un servicio prestado con la tarifa vigente.
     *
     * @param historiaId atención.
     * @param rq         servicio y cantidad.
     * @return mensaje de éxito (201).
     */
    @PostMapping(value = "/{historiaId}/servicios", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> agregarServicio(@PathVariable Long historiaId, @RequestBody AtencionServicioRq rq);

    /**
     * Quita un servicio de una atención abierta.
     *
     * @param historiaId         atención.
     * @param atencionServicioId servicio registrado.
     * @return mensaje de éxito.
     */
    @DeleteMapping(value = "/{historiaId}/servicios/{atencionServicioId}", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> quitarServicio(@PathVariable Long historiaId, @PathVariable Long atencionServicioId);

    /**
     * Finaliza la atención y marca la cita como atendida.
     *
     * @param historiaId atención.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{historiaId}/finalizar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> finalizar(@PathVariable Long historiaId);

    /**
     * Prefactura en PDF (servicios prestados y medicamentos formulados).
     *
     * @param historiaId atención.
     * @return documento PDF.
     */
    @GetMapping(value = "/{historiaId}/prefactura", produces = {"application/pdf", "application/json"})
    ResponseEntity<byte[]> prefactura(@PathVariable Long historiaId);
}
