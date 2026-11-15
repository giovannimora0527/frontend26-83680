package com.uniminuto.clinica.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.ServicioRq;
import com.uniminuto.clinica.models.ServicioRs;
import com.uniminuto.clinica.models.TarifaLogRs;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * Servicios REST de servicios y tarifas (consultas, procedimientos, laboratorio).
 */
@Tag(name = "17. Tarifas", description = "Servicios, tarifas, IVA y log de cambios")
@RequestMapping("/servicio")
public interface ServicioApi {

    /**
     * Lista los servicios con su tarifa vigente.
     *
     * @param soloActivos true para listar solo los activos.
     * @return servicios.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<List<ServicioRs>> listar(@RequestParam(defaultValue = "false") boolean soloActivos);

    /**
     * Consulta un servicio.
     *
     * @param id identificador.
     * @return servicio.
     */
    @GetMapping(value = "/{id}", produces = {"application/json"})
    ResponseEntity<ServicioRs> consultar(@PathVariable Long id);

    /**
     * Registra un servicio (201).
     *
     * @param rq datos.
     * @return mensaje de éxito.
     */
    @PostMapping(value = "/guardar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardar(@RequestBody ServicioRq rq);

    /**
     * Modifica un servicio; si cambia el valor o el IVA exige el motivo, que queda en el log.
     *
     * @param id identificador.
     * @param rq datos nuevos.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizar(@PathVariable Long id, @RequestBody ServicioRq rq);

    /**
     * Activa un servicio.
     *
     * @param id identificador.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}/activar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> activar(@PathVariable Long id);

    /**
     * Inactiva un servicio.
     *
     * @param id identificador.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}/inactivar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> inactivar(@PathVariable Long id);

    /**
     * Log de cambios de la tarifa.
     *
     * @param id identificador.
     * @return cambios, del más reciente al más antiguo.
     */
    @GetMapping(value = "/{id}/historial", produces = {"application/json"})
    ResponseEntity<List<TarifaLogRs>> historial(@PathVariable Long id);
}
