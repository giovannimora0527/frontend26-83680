package com.uniminuto.clinica.repository.spec;

import com.uniminuto.clinica.entity.FormulaMedica;
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
 * Filtros dinámicos del listado de fórmulas médicas. Cada criterio es opcional.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
public final class FormulaMedicaSpecifications {

    /** Clase utilitaria: no se instancia. */
    private FormulaMedicaSpecifications() {
    }

    /**
     * Combina todos los filtros opcionales.
     *
     * @param texto          Texto libre (mascota, veterinario o medicamento).
     * @param mascotaId      Mascota.
     * @param medicoId       Veterinario.
     * @param medicamentoId  Medicamento.
     * @param activa         {@code true} solo activas, {@code false} solo inactivas, {@code null} todas.
     * @param desde          Fecha de emisión mínima (inclusive).
     * @param hastaExclusivo Fecha de emisión máxima (exclusive).
     * @return Especificación lista para el repositorio.
     */
    public static Specification<FormulaMedica> conFiltros(String texto, Integer mascotaId, Long medicoId,
                                                          Long medicamentoId, Boolean activa,
                                                          LocalDateTime desde, LocalDateTime hastaExclusivo) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            if (mascotaId != null) {
                filtros.add(cb.equal(root.get("mascota").get("mascotaId"), mascotaId));
            }
            if (medicoId != null) {
                filtros.add(cb.equal(root.get("medico").get("id"), medicoId));
            }
            if (medicamentoId != null) {
                filtros.add(cb.equal(root.get("medicamento").get("id"), medicamentoId));
            }
            if (activa != null) {
                filtros.add(cb.equal(root.get("activa"), activa));
            }
            if (desde != null) {
                filtros.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get("fechaEmision"), desde));
            }
            if (hastaExclusivo != null) {
                filtros.add(cb.lessThan(root.<LocalDateTime>get("fechaEmision"), hastaExclusivo));
            }
            if (texto != null && !texto.isBlank()) {
                String patron = "%" + texto.trim().toLowerCase() + "%";
                Join<?, ?> mascota = root.join("mascota", JoinType.LEFT);
                Join<?, ?> medico = root.join("medico", JoinType.LEFT);
                Join<?, ?> medicamento = root.join("medicamento", JoinType.LEFT);
                filtros.add(cb.or(
                        cb.like(cb.lower(mascota.<String>get("nombreMascota")), patron),
                        cb.like(nombreCompleto(cb, medico.get("nombres"), medico.get("apellidos")), patron),
                        cb.like(cb.lower(medicamento.<String>get("nombre")), patron)));
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
