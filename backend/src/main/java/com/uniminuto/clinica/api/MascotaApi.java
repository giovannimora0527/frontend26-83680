package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * Servicios REST de mascotas: GET para consultar, POST para crear y PUT para
 * editar. No se eliminan porque sus citas, historias y fórmulas las referencian.
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/mascota")
public interface MascotaApi {

    /**
     * Lista todas las mascotas ordenadas por nombre.
     *
     * @return mascotas con su raza y su dueño.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<List<Mascota>> listarMascotas();

    /**
     * Lista las mascotas de un cliente (combo dependiente cliente → mascota).
     *
     * @param clienteId identificador del cliente.
     * @return mascotas del cliente.
     */
    @GetMapping(value = "/listar-by-cliente", produces = {"application/json"})
    ResponseEntity<List<Mascota>> buscarMascotasPorCliente(@RequestParam Long clienteId);

    /**
     * Lista las mascotas de una raza.
     *
     * @param razaId identificador de la raza.
     * @return mascotas de la raza.
     */
    @GetMapping(value = "/listar-by-raza", produces = {"application/json"})
    ResponseEntity<List<Mascota>> buscarMascotasPorRaza(@RequestParam Integer razaId);

    /**
     * Consulta una mascota.
     *
     * @param mascotaId identificador.
     * @return la mascota (404 si no existe).
     */
    @GetMapping(value = "/{mascotaId}", produces = {"application/json"})
    ResponseEntity<Mascota> consultarMascota(@PathVariable Integer mascotaId);

    /**
     * Registra una mascota para un cliente activo.
     *
     * @param mascotaRq datos de la mascota.
     * @return mensaje de éxito con estado 201.
     */
    @PostMapping(value = "/guardar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarMascota(@RequestBody MascotaRq mascotaRq);

    /**
     * Modifica nombre, edad y raza de una mascota (el dueño no cambia).
     *
     * @param mascotaId identificador.
     * @param mascotaRq nuevos datos.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{mascotaId}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizarMascota(@PathVariable Integer mascotaId,
                                                    @RequestBody MascotaRq mascotaRq);
}
