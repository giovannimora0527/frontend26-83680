package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.FormulaDetalleRs;
import com.uniminuto.clinica.models.FormulaRq;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.PaginaRs;

import java.time.LocalDate;

/**
 * Contrato de la lógica de negocio de las fórmulas médicas.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
public interface FormulaMedicaService {

    /**
     * Lista fórmulas con paginación, filtros y orden (por defecto fecha de creación descendente).
     *
     * @param page          Página (desde 0).
     * @param size          Tamaño de página.
     * @param sortBy        Campo de orden (fechaCreacion, fechaEmision, mascota, medico, medicamento, estado).
     * @param sortDir       asc o desc.
     * @param texto         Texto libre opcional.
     * @param mascotaId     Mascota opcional.
     * @param medicoId      Veterinario opcional.
     * @param medicamentoId Medicamento opcional.
     * @param activa        Activa/inactiva opcional.
     * @param fechaDesde    Fecha de emisión inicial opcional.
     * @param fechaHasta    Fecha de emisión final opcional.
     * @return Página de fórmulas (resumen).
     */
    PaginaRs<FormulaRs> listarFormulas(int page, int size, String sortBy, String sortDir, String texto,
                                       Integer mascotaId, Long medicoId, Long medicamentoId, Boolean activa,
                                       LocalDate fechaDesde, LocalDate fechaHasta);

    /**
     * Consulta el detalle completo de una fórmula.
     *
     * @param id Identificador de la fórmula.
     * @return Detalle de la fórmula.
     */
    FormulaDetalleRs obtenerFormula(Long id);

    /**
     * Crea una fórmula validando todas las reglas de negocio.
     *
     * @param rq Datos de la fórmula.
     * @return Detalle de la fórmula creada.
     */
    FormulaDetalleRs crearFormula(FormulaRq rq);

    /**
     * Actualiza los datos modificables de una fórmula activa.
     *
     * @param id Identificador de la fórmula.
     * @param rq Nuevos datos.
     * @return Detalle de la fórmula actualizada.
     */
    FormulaDetalleRs actualizarFormula(Long id, FormulaRq rq);

    /**
     * Inactiva una fórmula (reemplaza a la eliminación física).
     *
     * @param id Identificador de la fórmula.
     * @return Detalle de la fórmula inactivada.
     */
    FormulaDetalleRs inactivarFormula(Long id);
}
