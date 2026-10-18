package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.AnotacionRq;
import com.uniminuto.clinica.models.AnotacionRs;
import com.uniminuto.clinica.models.PaginaRs;

import java.time.LocalDate;

/**
 * Contrato de la lógica de negocio de las anotaciones de historia clínica.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
public interface AnotacionHistoriaService {

    /**
     * Lista anotaciones con paginación, filtros y orden (por defecto la más reciente primero).
     *
     * @param page       Página (desde 0).
     * @param size       Tamaño de página.
     * @param sortBy     Campo de orden (fecha, medico).
     * @param sortDir    asc o desc.
     * @param texto      Texto libre opcional.
     * @param historiaId Historia clínica opcional.
     * @param mascotaId  Mascota opcional (histórico completo de la mascota).
     * @param medicoId   Veterinario opcional.
     * @param fechaDesde Fecha inicial opcional.
     * @param fechaHasta Fecha final opcional.
     * @return Página de anotaciones.
     */
    PaginaRs<AnotacionRs> listarAnotaciones(int page, int size, String sortBy, String sortDir, String texto,
                                            Long historiaId, Integer mascotaId, Long medicoId,
                                            LocalDate fechaDesde, LocalDate fechaHasta);

    /**
     * Consulta el detalle de una anotación.
     *
     * @param id Identificador de la anotación.
     * @return La anotación.
     */
    AnotacionRs obtenerAnotacion(Long id);

    /**
     * Agrega una anotación a una historia clínica abierta.
     *
     * @param rq Datos de la anotación.
     * @return La anotación creada.
     */
    AnotacionRs crearAnotacion(AnotacionRq rq);
}
