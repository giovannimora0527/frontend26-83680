package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.HistoriaClinicaDetalleRs;
import com.uniminuto.clinica.models.HistoriaClinicaRq;
import com.uniminuto.clinica.models.HistoriaClinicaRs;
import com.uniminuto.clinica.models.PaginaRs;

import java.time.LocalDate;

/**
 * Contrato de la lógica de negocio de las historias clínicas.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
public interface HistoriaClinicaService {

    /**
     * Lista las historias con paginación, filtros y ordenamiento (por defecto fecha descendente).
     *
     * @param page       Página (desde 0).
     * @param size       Tamaño de página.
     * @param sortBy     Campo de orden (fechaHora, estado, cliente, mascota, medico, motivo).
     * @param sortDir    asc o desc.
     * @param texto      Texto libre opcional.
     * @param estado     Estado opcional.
     * @param clienteId  Cliente opcional.
     * @param mascotaId  Mascota opcional.
     * @param medicoId   Veterinario opcional.
     * @param fechaDesde Fecha inicial opcional.
     * @param fechaHasta Fecha final opcional.
     * @return Página de historias (resumen).
     */
    PaginaRs<HistoriaClinicaRs> listarHistorias(int page, int size, String sortBy, String sortDir, String texto,
                                                String estado, Long clienteId, Integer mascotaId, Long medicoId,
                                                LocalDate fechaDesde, LocalDate fechaHasta);

    /**
     * Consulta el detalle completo de una historia.
     *
     * @param id Identificador de la historia.
     * @return Detalle de la historia.
     */
    HistoriaClinicaDetalleRs obtenerHistoria(Long id);

    /**
     * Crea una historia clínica a partir de una cita atendida.
     *
     * @param rq Datos de la historia.
     * @return Detalle de la historia creada.
     */
    HistoriaClinicaDetalleRs crearHistoria(HistoriaClinicaRq rq);

    /**
     * Cierra una historia clínica; después no admite nuevas anotaciones.
     *
     * @param id Identificador de la historia.
     * @return Detalle de la historia cerrada.
     */
    HistoriaClinicaDetalleRs cerrarHistoria(Long id);
}
