package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.CitaRs;
import com.uniminuto.clinica.models.PaginaRs;

import java.time.LocalDate;

/**
 * Contrato de la lógica de negocio de las citas médicas.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
public interface CitaService {

    /**
     * Lista las citas con paginación, filtros y ordenamiento aplicados en base de datos.
     *
     * @param page      Número de página (empieza en 0).
     * @param size      Tamaño de página (1 a 100).
     * @param sortBy    Campo de ordenamiento (fechaHora, estado, cliente, mascota, medico).
     * @param sortDir   Dirección: asc o desc.
     * @param texto     Texto libre opcional (cliente, mascota o veterinario).
     * @param estado    Estado opcional.
     * @param clienteId Cliente opcional.
     * @param mascotaId Mascota opcional.
     * @param medicoId  Veterinario opcional.
     * @param fechaDesde Fecha inicial opcional (inclusive).
     * @param fechaHasta Fecha final opcional (inclusive).
     * @return Página de citas.
     */
    PaginaRs<CitaRs> listarCitas(int page, int size, String sortBy, String sortDir, String texto,
                                 String estado, Long clienteId, Integer mascotaId, Long medicoId,
                                 LocalDate fechaDesde, LocalDate fechaHasta);

    /**
     * Consulta una cita por su identificador.
     *
     * @param id Identificador de la cita.
     * @return La cita encontrada.
     */
    CitaRs obtenerCita(Long id);

    /**
     * Crea una cita validando todas las reglas de negocio.
     *
     * @param rq Datos de la cita.
     * @return La cita creada.
     */
    CitaRs crearCita(CitaRq rq);

    /**
     * Actualiza una cita respetando las restricciones según su estado actual.
     *
     * @param id Identificador de la cita.
     * @param rq Nuevos datos.
     * @return La cita actualizada.
     */
    CitaRs actualizarCita(Long id, CitaRq rq);

    /**
     * Cambia el estado de una cita validando que la transición sea permitida.
     *
     * @param id     Identificador de la cita.
     * @param estado Nuevo estado.
     * @return La cita actualizada.
     */
    CitaRs cambiarEstado(Long id, String estado);

    /**
     * Reactiva una cita cancelada (operación explícita) dejándola en estado PENDIENTE.
     *
     * @param id Identificador de la cita.
     * @return La cita reactivada.
     */
    CitaRs reactivarCita(Long id);
}
