package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.EstadoHistoria;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Construye la consulta dinámica del listado de historias clínicas: cada
 * filtro solo se aplica si el usuario lo envió.
 */
public final class HistoriaSpecification {

    /**
     * Clase utilitaria: no se instancia.
     */
    private HistoriaSpecification() {
    }

    /**
     * Arma la especificación con los filtros recibidos.
     *
     * @param texto     texto libre (mascota, cliente, veterinario, motivo, diagnóstico).
     * @param estado    estado de la historia.
     * @param clienteId cliente dueño de la mascota.
     * @param mascotaId mascota.
     * @param medicoId  veterinario.
     * @param desde     fecha inicial, incluida.
     * @param hasta     fecha final, incluida.
     * @return especificación para el repositorio.
     */
    public static Specification<HistoriaClinica> conFiltros(
            String texto, EstadoHistoria estado, Long clienteId, Integer mascotaId, Long medicoId,
            LocalDate desde, LocalDate hasta) {

        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();

            Join<HistoriaClinica, Mascota> mascota = root.join("mascota");
            Join<Mascota, Cliente> cliente = mascota.join("cliente");
            Join<HistoriaClinica, Medico> medico = root.join("medico");

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
                        cb.like(cb.lower(root.<String>get("motivo")), patron),
                        cb.like(cb.lower(root.<String>get("diagnostico")), patron)));
            }
            if (estado != null) {
                filtros.add(cb.equal(root.get("estado"), estado));
            }
            if (clienteId != null) {
                filtros.add(cb.equal(cliente.get("clienteId"), clienteId));
            }
            if (mascotaId != null) {
                filtros.add(cb.equal(mascota.get("mascotaId"), mascotaId));
            }
            if (medicoId != null) {
                filtros.add(cb.equal(medico.get("id"), medicoId));
            }
            if (desde != null) {
                filtros.add(cb.greaterThanOrEqualTo(
                        root.<LocalDateTime>get("fechaHora"), desde.atStartOfDay()));
            }
            if (hasta != null) {
                filtros.add(cb.lessThan(
                        root.<LocalDateTime>get("fechaHora"),
                        hasta.plusDays(1).atStartOfDay()));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }
}
