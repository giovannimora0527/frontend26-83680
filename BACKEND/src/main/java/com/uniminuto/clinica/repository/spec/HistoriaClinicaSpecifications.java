package com.uniminuto.clinica.repository.spec;

import com.uniminuto.clinica.entity.HistoriaClinica;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Filtros dinámicos del listado de historias clínicas. Cada criterio es opcional.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
public final class HistoriaClinicaSpecifications {

    /** Clase utilitaria: no se instancia. */
    private HistoriaClinicaSpecifications() {
    }

    /**
     * Combina todos los filtros opcionales.
     *
     * @param texto          Texto libre (cliente, mascota, veterinario o motivo).
     * @param estado         Estado exacto.
     * @param clienteId      Cliente.
     * @param mascotaId      Mascota.
     * @param medicoId       Veterinario.
     * @param desde          Fecha y hora mínima (inclusive).
     * @param hastaExclusivo Fecha y hora máxima (exclusive).
     * @return Especificación lista para el repositorio.
     */
    public static Specification<HistoriaClinica> conFiltros(String texto, String estado, Long clienteId,
                                                            Integer mascotaId, Long medicoId,
                                                            LocalDateTime desde, LocalDateTime hastaExclusivo) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            if (clienteId != null) {
                filtros.add(cb.equal(root.get("cliente").get("clienteId"), clienteId));
            }
            if (mascotaId != null) {
                filtros.add(cb.equal(root.get("mascota").get("mascotaId"), mascotaId));
            }
            if (medicoId != null) {
                filtros.add(cb.equal(root.get("medico").get("id"), medicoId));
            }
            if (estado != null && !estado.isBlank()) {
                filtros.add(cb.equal(cb.upper(root.get("estado")), estado.trim().toUpperCase()));
            }
            if (desde != null) {
                filtros.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get("fechaHora"), desde));
            }
            if (hastaExclusivo != null) {
                filtros.add(cb.lessThan(root.<LocalDateTime>get("fechaHora"), hastaExclusivo));
            }
            if (texto != null && !texto.isBlank()) {
                String patron = "%" + texto.trim().toLowerCase() + "%";
                Join<?, ?> cliente = root.join("cliente", JoinType.LEFT);
                Join<?, ?> mascota = root.join("mascota", JoinType.LEFT);
                Join<?, ?> medico = root.join("medico", JoinType.LEFT);
                filtros.add(cb.or(
                        cb.like(nombreCompleto(cb, cliente.get("nombres"), cliente.get("apellidos")), patron),
                        cb.like(cb.lower(mascota.<String>get("nombreMascota")), patron),
                        cb.like(nombreCompleto(cb, medico.get("nombres"), medico.get("apellidos")), patron),
                        cb.like(cb.lower(root.<String>get("motivoConsulta")), patron)));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }

    /**
     * Arma la expresión "nombres apellidos" en minúscula.
     *
     * @param cb        Constructor de criterios.
     * @param nombres   Expresión de nombres.
     * @param apellidos Expresión de apellidos.
     * @return Expresión concatenada en minúscula.
     */
    @SuppressWarnings("unchecked")
    private static Expression<String> nombreCompleto(CriteriaBuilder cb, Expression<?> nombres,
                                                     Expression<?> apellidos) {
        return cb.lower(cb.concat(cb.concat((Expression<String>) nombres, " "), (Expression<String>) apellidos));
    }
}
