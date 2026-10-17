package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.FormulaFiltroRq;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;

/**
 * Operaciones de negocio de las fórmulas médicas.
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
     * @return la fórmula encontrada.
     */
    FormulaRs consultarFormula(Long formulaId);

    /**
     * Registra una fórmula validando todas las reglas de negocio.
     *
     * @param formulaRq datos de la fórmula.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardarFormula(FormulaRq formulaRq);

    /**
     * Modifica los datos del tratamiento de una fórmula activa.
     *
     * @param formulaId identificador de la fórmula.
     * @param formulaRq nuevos datos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizarFormula(Long formulaId, FormulaRq formulaRq);

    /**
     * Inactiva una fórmula (no se elimina porque es información clínica).
     *
     * @param formulaId identificador de la fórmula.
     * @return mensaje de éxito.
     */
    MiRespuestaRS inactivarFormula(Long formulaId);
}
