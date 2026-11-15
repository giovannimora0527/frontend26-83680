package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.FormulaFiltroRq;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MotivoRq;
import com.uniminuto.clinica.models.PaginaRs;

/**
 * Operaciones de negocio de las fórmulas médicas (formulación por el veterinario).
 */
public interface FormulaService {

    /**
     * Lista las fórmulas con paginación, orden y filtros (por defecto, las más
     * recientes primero).
     *
     * @param filtro parámetros de consulta.
     * @return página de fórmulas.
     */
    PaginaRs<FormulaRs> listarFormulas(FormulaFiltroRq filtro);

    /**
     * Consulta el detalle completo de una fórmula.
     *
     * @param formulaId identificador de la fórmula.
     * @return la fórmula con sus líneas, historial y entregas.
     */
    FormulaRs consultarFormula(Long formulaId);

    /**
     * Registra una fórmula como borrador o confirmada.
     *
     * @param formulaRq datos de la fórmula.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardarFormula(FormulaRq formulaRq);

    /**
     * Modifica una fórmula en borrador.
     *
     * @param formulaId identificador de la fórmula.
     * @param formulaRq nuevos datos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizarFormula(Long formulaId, FormulaRq formulaRq);

    /**
     * Confirma una fórmula en borrador para que pase a despacho.
     *
     * @param formulaId identificador de la fórmula.
     * @return mensaje de éxito.
     */
    MiRespuestaRS confirmarFormula(Long formulaId);

    /**
     * Anula una fórmula que no tiene entregas.
     *
     * @param formulaId identificador de la fórmula.
     * @param rq        motivo de la anulación.
     * @return mensaje de éxito.
     */
    MiRespuestaRS anularFormula(Long formulaId, MotivoRq rq);

    /**
     * Genera la fórmula en PDF.
     *
     * @param formulaId identificador de la fórmula.
     * @return contenido del PDF.
     */
    byte[] generarPdf(Long formulaId);
}
