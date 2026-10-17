package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.models.MedicoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.util.List;

/**
 * Operaciones de negocio de los veterinarios.
 */
public interface MedicoService {

    /**
     * Lista los veterinarios ordenados por nombre.
     *
     * @return lista de veterinarios.
     */
    List<Medico> listarMedicos();

    /**
     * Consulta un veterinario.
     *
     * @param id identificador.
     * @return el veterinario encontrado.
     */
    Medico consultarMedico(Long id);

    /**
     * Registra un veterinario con documento y registro profesional únicos.
     *
     * @param rq datos del veterinario.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardarMedico(MedicoRq rq);

    /**
     * Modifica un veterinario manteniendo documento y registro únicos.
     *
     * @param id identificador.
     * @param rq nuevos datos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizarMedico(Long id, MedicoRq rq);
}
