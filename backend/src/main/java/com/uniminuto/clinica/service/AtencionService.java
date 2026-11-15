package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.AgendaAtencionRs;
import com.uniminuto.clinica.models.AtencionRq;
import com.uniminuto.clinica.models.AtencionRs;
import com.uniminuto.clinica.models.AtencionServicioRq;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.time.LocalDate;
import java.util.List;

/**
 * Atención médica de las citas por parte del veterinario.
 */
public interface AtencionService {

    /**
     * Citas del veterinario de la sesión en un día, con el estado de su atención,
     * más las atenciones que dejó abiertas en días anteriores.
     *
     * @param fecha día (null = hoy).
     * @return agenda.
     */
    List<AgendaAtencionRs> agenda(LocalDate fecha);

    /**
     * Inicia la atención de una cita (o devuelve la ya iniciada).
     *
     * @param citaId cita.
     * @return la atención.
     */
    AtencionRs iniciar(Long citaId);

    /**
     * Consulta una atención con antecedentes, servicios y fórmulas.
     *
     * @param historiaId atención.
     * @return la atención.
     */
    AtencionRs consultar(Long historiaId);

    /**
     * Guarda los datos clínicos de una atención abierta.
     *
     * @param historiaId atención.
     * @param rq         datos clínicos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardar(Long historiaId, AtencionRq rq);

    /**
     * Agrega un servicio prestado (con la tarifa vigente).
     *
     * @param historiaId atención.
     * @param rq         servicio y cantidad.
     * @return mensaje de éxito.
     */
    MiRespuestaRS agregarServicio(Long historiaId, AtencionServicioRq rq);

    /**
     * Quita un servicio de una atención abierta.
     *
     * @param historiaId         atención.
     * @param atencionServicioId servicio registrado.
     * @return mensaje de éxito.
     */
    MiRespuestaRS quitarServicio(Long historiaId, Long atencionServicioId);

    /**
     * Finaliza la atención: cierra la historia y marca la cita como atendida.
     *
     * @param historiaId atención.
     * @return mensaje de éxito.
     */
    MiRespuestaRS finalizar(Long historiaId);

    /**
     * Prefactura en PDF: servicios prestados y medicamentos formulados.
     *
     * @param historiaId atención.
     * @return contenido del PDF.
     */
    byte[] prefactura(Long historiaId);
}
