package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Raza;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos de las mascotas.
 */
@Repository
public interface MascotaRepository extends JpaRepository<Mascota, Integer> {

    /**
     * Lista todas las mascotas ordenadas por nombre.
     *
     * @return mascotas.
     */
    List<Mascota> findAllByOrderByNombreMascotaAsc();

    /**
     * Lista las mascotas de un cliente ordenadas por nombre.
     *
     * @param cliente dueño.
     * @return mascotas del cliente.
     */
    List<Mascota> findAllByClienteOrderByNombreMascotaAsc(Cliente cliente);

    /**
     * Lista las mascotas de una raza ordenadas por nombre.
     *
     * @param raza raza.
     * @return mascotas de la raza.
     */
    List<Mascota> findAllByRazaOrderByNombreMascotaAsc(Raza raza);

    /**
     * Indica si el cliente ya tiene otra mascota (distinta de la indicada) con ese nombre.
     *
     * @param clienteId     dueño.
     * @param nombreMascota nombre (sin distinguir mayúsculas).
     * @param mascotaId     mascota que se edita (-1 al crear).
     * @return true si existe.
     */
    boolean existsByCliente_ClienteIdAndNombreMascotaIgnoreCaseAndMascotaIdNot(
            Long clienteId, String nombreMascota, Integer mascotaId);
}
