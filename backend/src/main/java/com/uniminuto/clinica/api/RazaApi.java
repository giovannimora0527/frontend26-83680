package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.RazaRq;
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
 * Servicios REST de razas: GET para consultar, POST para crear y PUT para
 * editar. Las razas no se eliminan porque las mascotas las referencian.
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/raza")
public interface RazaApi {

    /**
     * Lista las razas ordenadas por especie y nombre.
     *
     * @return lista de razas.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<List<Raza>> listarRazas();

    /**
     * Consulta una raza.
     *
     * @param razaId identificador de la raza.
     * @return la raza (404 si no existe).
     */
    @GetMapping(value = "/{razaId}", produces = {"application/json"})
    ResponseEntity<Raza> consultarRaza(@PathVariable Integer razaId);

    /**
     * Registra una raza nueva.
     *
     * @param razaRq datos de la raza.
     * @return mensaje de éxito con estado 201.
     */
    @PostMapping(value = "/guardar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarRaza(@RequestBody RazaRq razaRq);

    /**
     * Modifica una raza.
     *
     * @param razaId identificador de la raza.
     * @param razaRq nuevos datos.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{razaId}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizarRaza(@PathVariable Integer razaId, @RequestBody RazaRq razaRq);
}
