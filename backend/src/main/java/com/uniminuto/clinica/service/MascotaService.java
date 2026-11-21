package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.util.List;

public interface MascotaService {
    List<Mascota> listarMascotas();

    List<Mascota> listarMascotasOrdenado(boolean ascendente);

    List<Mascota> buscarPorNombre(String nombre);

    List<Mascota> buscarMascotasPorCliente(Long clienteId);

    List<Mascota> buscarMascotasPorRaza(Integer razaId);

    Mascota consultar(Integer mascotaId);

    MiRespuestaRS guardarMascota(MascotaRq rq);

    MiRespuestaRS actualizarMascota(MascotaRq rq);

    MiRespuestaRS cambiarEstado(Integer mascotaId, boolean activo);
}
