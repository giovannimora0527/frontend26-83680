package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.models.ClienteRq;
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
 * Servicios REST de clientes: GET para consultar, POST para crear y PUT para
 * editar, activar o inactivar (un cliente no se elimina para no dejar
 * mascotas, citas ni historias huérfanas).
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/cliente")
public interface ClienteApi {

    /**
     * Lista los clientes ordenados por nombre.
     *
     * @param soloActivos true para devolver solo los activos (combos de citas,
     *                    historias y fórmulas); por defecto se devuelven todos.
     * @return lista de clientes.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<List<Cliente>> listarClientes(
            @RequestParam(defaultValue = "false") boolean soloActivos);

    /**
     * Consulta un cliente.
     *
     * @param clienteId identificador del cliente.
     * @return el cliente (404 si no existe).
     */
    @GetMapping(value = "/{clienteId}", produces = {"application/json"})
    ResponseEntity<Cliente> consultarCliente(@PathVariable Long clienteId);

    /**
     * Registra un cliente nuevo (queda activo).
     *
     * @param clienteRq datos del cliente.
     * @return mensaje de éxito con estado 201.
     */
    @PostMapping(value = "/guardar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarCliente(@RequestBody ClienteRq clienteRq);

    /**
     * Modifica los datos de un cliente activo.
     *
     * @param clienteId identificador del cliente.
     * @param clienteRq nuevos datos.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{clienteId}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizarCliente(@PathVariable Long clienteId,
                                                    @RequestBody ClienteRq clienteRq);

    /**
     * Activa un cliente inactivo.
     *
     * @param clienteId identificador del cliente.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{clienteId}/activar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> activarCliente(@PathVariable Long clienteId);

    /**
     * Inactiva un cliente (no puede tener citas por atender).
     *
     * @param clienteId identificador del cliente.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{clienteId}/inactivar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> inactivarCliente(@PathVariable Long clienteId);
}
