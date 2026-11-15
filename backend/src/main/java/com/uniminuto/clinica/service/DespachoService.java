package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.DespachoFiltroRq;
import com.uniminuto.clinica.models.DespachoRq;
import com.uniminuto.clinica.models.DespachoRs;
import com.uniminuto.clinica.models.FormulaFiltroRq;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MotivoRq;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.PreparacionDespachoRs;

/**
 * Operaciones del despacho y dispensación de medicamentos.
 */
public interface DespachoService {

    /**
     * Lista las fórmulas confirmadas con medicamentos por entregar.
     *
     * @param filtro búsqueda, fechas y página.
     * @return página de fórmulas pendientes.
     */
    PaginaRs<FormulaRs> listarPendientes(FormulaFiltroRq filtro);

    /**
     * Consulta lo necesario para preparar el despacho de una fórmula: lo
     * pendiente por línea y los lotes con la selección sugerida.
     *
     * @param formulaId identificador de la fórmula.
     * @return información de preparación.
     */
    PreparacionDespachoRs consultarPreparacion(Long formulaId);

    /**
     * Marca la fórmula como en preparación.
     *
     * @param formulaId identificador de la fórmula.
     * @return mensaje de éxito.
     */
    MiRespuestaRS iniciarPreparacion(Long formulaId);

    /**
     * Confirma una entrega y descuenta el inventario en una sola transacción.
     *
     * @param formulaId identificador de la fórmula.
     * @param rq        unidades entregadas por línea y lote.
     * @return la entrega registrada.
     */
    DespachoRs confirmarEntrega(Long formulaId, DespachoRq rq);

    /**
     * Marca la fórmula como pendiente por disponibilidad.
     *
     * @param formulaId identificador de la fórmula.
     * @param rq        observación.
     * @return mensaje de éxito.
     */
    MiRespuestaRS marcarSinDisponibilidad(Long formulaId, MotivoRq rq);

    /**
     * Cancela el despacho de una fórmula que no tiene entregas.
     *
     * @param formulaId identificador de la fórmula.
     * @param rq        motivo de la cancelación.
     * @return mensaje de éxito.
     */
    MiRespuestaRS cancelarDespacho(Long formulaId, MotivoRq rq);

    /**
     * Revierte una entrega confirmada devolviendo las unidades a sus lotes.
     *
     * @param despachoId identificador de la entrega.
     * @param rq         motivo de la reversión.
     * @return mensaje de éxito.
     */
    MiRespuestaRS revertirEntrega(Long despachoId, MotivoRq rq);

    /**
     * Consulta el historial de entregas.
     *
     * @param filtro búsqueda, estado, fechas y página.
     * @return página de entregas, de la más reciente a la más antigua.
     */
    PaginaRs<DespachoRs> listarHistorial(DespachoFiltroRq filtro);

    /**
     * Genera el comprobante de una entrega en PDF.
     *
     * @param despachoId identificador de la entrega.
     * @return contenido del PDF.
     */
    byte[] generarComprobante(Long despachoId);
}
