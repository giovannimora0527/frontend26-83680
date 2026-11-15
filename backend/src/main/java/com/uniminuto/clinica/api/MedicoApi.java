package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.models.HorarioRq;
import com.uniminuto.clinica.models.HorarioRs;
import com.uniminuto.clinica.models.MedicoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

/**
 * Servicios REST de veterinarios: GET para consultar, POST para crear y PUT
 * para editar. No se eliminan porque sus citas, historias y fórmulas los referencian.
 */
@RequestMapping("/medico")
public interface MedicoApi {

    /**
     * Lista los veterinarios ordenados por nombre.
     *
     * @return lista de veterinarios con su especialización.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<List<Medico>> listarMedicos();

    /**
     * Consulta un veterinario.
     *
     * @param id identificador.
     * @return el veterinario (404 si no existe).
     */
    @GetMapping(value = "/{id}", produces = {"application/json"})
    ResponseEntity<Medico> consultarMedico(@PathVariable Long id);

    /**
     * Registra un veterinario.
     *
     * @param rq datos del veterinario.
     * @return mensaje de éxito con estado 201.
     */
    @PostMapping(value = "/guardar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarMedico(@RequestBody MedicoRq rq);

    /**
     * Modifica un veterinario.
     *
     * @param id identificador.
     * @param rq nuevos datos.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizarMedico(@PathVariable Long id, @RequestBody MedicoRq rq);

    /**
     * Activa un veterinario.
     *
     * @param id identificador.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}/activar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> activarMedico(@PathVariable Long id);

    /**
     * Inactiva un veterinario (409 si tiene citas futuras activas).
     *
     * @param id identificador.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}/inactivar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> inactivarMedico(@PathVariable Long id);

    /**
     * Horario semanal de disponibilidad del veterinario.
     *
     * @param id identificador.
     * @return franjas (diaSemana 1 = lunes ... 7 = domingo).
     */
    @GetMapping(value = "/{id}/horarios", produces = {"application/json"})
    ResponseEntity<List<HorarioRs>> listarHorarios(@PathVariable Long id);

    /**
     * Reemplaza el horario semanal del veterinario.
     *
     * @param id      identificador.
     * @param franjas franjas nuevas.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}/horarios", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarHorarios(@PathVariable Long id, @RequestBody List<HorarioRq> franjas);
}
