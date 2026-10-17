package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.models.EspecializacionRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

/**
 * Servicios REST de especializaciones médicas: GET para consultar, POST para
 * crear y PUT para editar. No se eliminan porque los veterinarios las referencian.
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/especializacion")
public interface EspecializacionApi {

    /**
     * Lista las especializaciones ordenadas por nombre.
     *
     * @return lista de especializaciones.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<List<Especializacion>> listarEspecializaciones();

    /**
     * Consulta una especialización.
     *
     * @param id identificador.
     * @return la especialización (404 si no existe).
     */
    @GetMapping(value = "/{id}", produces = {"application/json"})
    ResponseEntity<Especializacion> consultarEspecializacion(@PathVariable Long id);

    /**
     * Registra una especialización.
     *
     * @param rq datos de la especialización.
     * @return mensaje de éxito con estado 201.
     */
    @PostMapping(value = "/guardar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarEspecializacion(@RequestBody EspecializacionRq rq);

    /**
     * Modifica una especialización.
     *
     * @param id identificador.
     * @param rq nuevos datos.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizarEspecializacion(@PathVariable Long id, @RequestBody EspecializacionRq rq);
}
