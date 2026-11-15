package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.AjusteInventarioRq;
import com.uniminuto.clinica.models.LoteRq;
import com.uniminuto.clinica.models.MedicamentoRq;
import com.uniminuto.clinica.models.MedicamentoRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MovimientoRs;
import com.uniminuto.clinica.models.PaginaRs;
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
 * Servicios REST del inventario de medicamentos e insumos. Los productos no
 * se eliminan (se inactivan) y las existencias solo cambian mediante
 * movimientos registrados.
 */
@RequestMapping("/medicamento")
public interface MedicamentoApi {

    /**
     * Lista los productos con sus existencias y alertas.
     *
     * @param soloActivos true para excluir los inactivos.
     * @return productos ordenados por nombre.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<List<MedicamentoRs>> listarMedicamentos(
            @RequestParam(defaultValue = "false") boolean soloActivos);

    /**
     * Consulta un producto con todos sus lotes.
     *
     * @param id identificador del producto.
     * @return detalle del producto (404 si no existe).
     */
    @GetMapping(value = "/{id}", produces = {"application/json"})
    ResponseEntity<MedicamentoRs> consultarMedicamento(@PathVariable Long id);

    /**
     * Registra un producto.
     *
     * @param rq datos del producto.
     * @return mensaje de éxito con estado 201.
     */
    @PostMapping(value = "/guardar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarMedicamento(@RequestBody MedicamentoRq rq);

    /**
     * Modifica un producto.
     *
     * @param id identificador del producto.
     * @param rq nuevos datos.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizarMedicamento(@PathVariable Long id, @RequestBody MedicamentoRq rq);

    /**
     * Activa un producto.
     *
     * @param id identificador del producto.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}/activar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> activarMedicamento(@PathVariable Long id);

    /**
     * Inactiva un producto.
     *
     * @param id identificador del producto.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{id}/inactivar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> inactivarMedicamento(@PathVariable Long id);

    /**
     * Registra la entrada de un lote y su movimiento.
     *
     * @param id identificador del producto.
     * @param rq datos del lote.
     * @return mensaje de éxito con estado 201.
     */
    @PostMapping(value = "/{id}/lotes", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> registrarLote(@PathVariable Long id, @RequestBody LoteRq rq);

    /**
     * Corrige la existencia de un lote dejando el motivo registrado.
     *
     * @param loteId identificador del lote.
     * @param rq     sentido, cantidad y motivo.
     * @return mensaje de éxito.
     */
    @PostMapping(value = "/lote/{loteId}/ajuste", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> ajustarLote(@PathVariable Long loteId, @RequestBody AjusteInventarioRq rq);

    /**
     * Consulta el historial de entradas y salidas de un producto, del más
     * reciente al más antiguo.
     *
     * @param id   identificador del producto.
     * @param page página (empieza en 0).
     * @param size registros por página.
     * @return página de movimientos.
     */
    @GetMapping(value = "/{id}/movimientos", produces = {"application/json"})
    ResponseEntity<PaginaRs<MovimientoRs>> listarMovimientos(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size);
}
