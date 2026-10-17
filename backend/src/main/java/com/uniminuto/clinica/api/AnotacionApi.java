package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.AnotacionRq;
import com.uniminuto.clinica.models.AnotacionRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Servicios REST de anotaciones de historias clínicas.
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/anotacion")
public interface AnotacionApi {

    /**
     * Lista las anotaciones de una historia (por defecto, la más reciente primero).
     *
     * @param historiaId historia de la que se listan (obligatorio).
     * @param page       página (empieza en 0).
     * @param size       registros por página (1 a 100).
     * @param orden      fecha o medico.
     * @param direccion  asc o desc.
     * @param texto      texto libre.
     * @return página de anotaciones.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<PaginaRs<AnotacionRs>> listarAnotaciones(
            @RequestParam Long historiaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String orden,
            @RequestParam(required = false) String direccion,
            @RequestParam(required = false) String texto);

    /**
     * Consulta una anotación.
     *
     * @param anotacionId identificador de la anotación.
     * @return la anotación (404 si no existe).
     */
    @GetMapping(value = "/{anotacionId}", produces = {"application/json"})
    ResponseEntity<AnotacionRs> consultarAnotacion(@PathVariable Long anotacionId);

    /**
     * Crea una anotación en una historia.
     *
     * @param anotacionRq datos de la anotación.
     * @return mensaje de éxito con estado 201.
     */
    @PostMapping(value = "/guardar",
            produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarAnotacion(@RequestBody AnotacionRq anotacionRq);
}
