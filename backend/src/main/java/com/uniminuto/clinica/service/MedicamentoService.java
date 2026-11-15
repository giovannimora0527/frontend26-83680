package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.AjusteInventarioRq;
import com.uniminuto.clinica.models.LoteRq;
import com.uniminuto.clinica.models.MedicamentoRq;
import com.uniminuto.clinica.models.MedicamentoRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MovimientoRs;
import com.uniminuto.clinica.models.PaginaRs;

import java.util.List;

/**
 * Operaciones de negocio del inventario de medicamentos e insumos.
 */
public interface MedicamentoService {

    /**
     * Lista los productos con sus existencias y alertas.
     *
     * @param soloActivos true para excluir los inactivos.
     * @return productos ordenados por nombre.
     */
    List<MedicamentoRs> listarMedicamentos(boolean soloActivos);

    /**
     * Consulta un producto con todos sus lotes.
     *
     * @param id identificador del producto.
     * @return detalle del producto.
     */
    MedicamentoRs consultarMedicamento(Long id);

    /**
     * Registra un producto validando código, nombre, Invima y precios.
     *
     * @param rq datos del producto.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardarMedicamento(MedicamentoRq rq);

    /**
     * Modifica un producto activo.
     *
     * @param id identificador del producto.
     * @param rq nuevos datos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizarMedicamento(Long id, MedicamentoRq rq);

    /**
     * Activa o inactiva un producto.
     *
     * @param id      identificador del producto.
     * @param activar true para activar, false para inactivar.
     * @return mensaje de éxito.
     */
    MiRespuestaRS cambiarEstado(Long id, boolean activar);

    /**
     * Registra la entrada de un lote y su movimiento en una sola transacción.
     *
     * @param id identificador del producto.
     * @param rq datos del lote.
     * @return mensaje de éxito.
     */
    MiRespuestaRS registrarLote(Long id, LoteRq rq);

    /**
     * Corrige la existencia de un lote sin permitir cantidades negativas.
     *
     * @param loteId identificador del lote.
     * @param rq     sentido, cantidad y motivo.
     * @return mensaje de éxito.
     */
    MiRespuestaRS ajustarLote(Long loteId, AjusteInventarioRq rq);

    /**
     * Consulta el historial de entradas y salidas de un producto.
     *
     * @param id   identificador del producto.
     * @param page página (empieza en 0).
     * @param size registros por página.
     * @return página de movimientos, del más reciente al más antiguo.
     */
    PaginaRs<MovimientoRs> listarMovimientos(Long id, int page, int size);
}
