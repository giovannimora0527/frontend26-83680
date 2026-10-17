package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.EstadoCita;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Construye la consulta dinámica del listado de citas. Cada filtro solo se
 * aplica si el usuario lo envió, así el mismo método sirve para cualquier
 * combinación de criterios.
 */
public final class CitaSpecification {

    /**
     * Clase utilitaria: no se instancia.
     */
    private CitaSpecification() {
    }

    /**
     * Arma la especificación con los filtros recibidos.
     *
     * @param texto     texto libre a buscar en mascota, cliente, veterinario y motivo.
     * @param estado    estado de la cita.
     * @param medicoId  veterinario.
     * @param clienteId cliente dueño de la mascota.
     * @param mascotaId mascota.
     * @param desde     fecha inicial del rango, incluida.
     * @param hasta     fecha final del rango, incluida.
     * @return especificación lista para usar en el repositorio.
     */
    public static Specification<Cita> conFiltros(
            String texto,
            EstadoCita estado,
            Long medicoId,
            Long clienteId,
            Integer mascotaId,
            LocalDate desde,
            LocalDate hasta) {

        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();

            Join<Cita, Mascota> mascota = root.join("mascota");
            Join<Mascota, Cliente> cliente = mascota.join("cliente");
            Join<Cita, Medico> medico = root.join("medico");

            if (texto != null && !texto.isBlank()) {
                String patron = "%" + texto.trim().toLowerCase() + "%";
                filtros.add(cb.or(
                        cb.like(cb.lower(mascota.<String>get("nombreMascota")), patron),
                        cb.like(cb.lower(cb.concat(
                                cb.concat(cliente.<String>get("nombres"), " "),
                                cliente.<String>get("apellidos"))), patron),
                        cb.like(cb.lower(cb.concat(
                                cb.concat(medico.<String>get("nombres"), " "),
                                medico.<String>get("apellidos"))), patron),
                        cb.like(cb.lower(root.<String>get("motivo")), patron)));
            }
            if (estado != null) {
                filtros.add(cb.equal(root.get("estado"), estado));
            }
            if (medicoId != null) {
                filtros.add(cb.equal(medico.get("id"), medicoId));
            }
            if (clienteId != null) {
                filtros.add(cb.equal(cliente.get("clienteId"), clienteId));
            }
            if (mascotaId != null) {
                filtros.add(cb.equal(mascota.get("mascotaId"), mascotaId));
            }
            if (desde != null) {
                filtros.add(cb.greaterThanOrEqualTo(
                        root.<java.time.LocalDateTime>get("fechaHora"),
                        desde.atStartOfDay()));
            }
            if (hasta != null) {
                filtros.add(cb.lessThan(
                        root.<java.time.LocalDateTime>get("fechaHora"),
                        hasta.plusDays(1).atStartOfDay()));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }
}
