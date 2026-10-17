package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.util.List;

/**
 * Operaciones de negocio de las mascotas.
 */
public interface MascotaService {

    /**
     * Lista todas las mascotas ordenadas por nombre.
     *
     * @return mascotas.
     */
    List<Mascota> listarMascotas();

    /**
     * Lista las mascotas de un cliente.
     *
     * @param clienteId identificador del cliente.
     * @return mascotas del cliente.
     */
    List<Mascota> listarMascotasPorCliente(Long clienteId);

    /**
     * Lista las mascotas de una raza.
     *
     * @param razaId identificador de la raza.
     * @return mascotas de la raza.
     */
    List<Mascota> listarMascotasPorRaza(Integer razaId);

    /**
     * Consulta una mascota.
     *
     * @param mascotaId identificador.
     * @return la mascota encontrada.
     */
    Mascota consultarMascota(Integer mascotaId);

    /**
     * Registra una mascota validando cliente, raza y datos.
     *
     * @param mascotaRq datos de la mascota.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardarMascota(MascotaRq mascotaRq);

    /**
     * Modifica nombre, edad y raza de una mascota.
     *
     * @param mascotaId identificador.
     * @param mascotaRq nuevos datos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizarMascota(Integer mascotaId, MascotaRq mascotaRq);
}
