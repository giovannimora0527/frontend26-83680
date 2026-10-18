package com.uniminuto.clinica.repository.spec;

import com.uniminuto.clinica.entity.AnotacionHistoria;
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
 * Filtros dinámicos del listado de anotaciones. Permite consultar por historia clínica
 * o por mascota (histórico completo de la mascota).
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
public final class AnotacionHistoriaSpecifications {

    /** Clase utilitaria: no se instancia. */
    private AnotacionHistoriaSpecifications() {
    }

    /**
     * Combina todos los filtros opcionales.
     *
     * @param texto          Texto libre (descripción, observación, diagnóstico/evolución o veterinario).
     * @param historiaId     Historia clínica.
     * @param mascotaId      Mascota dueña de la historia.
     * @param medicoId       Veterinario autor.
     * @param desde          Fecha y hora mínima (inclusive).
     * @param hastaExclusivo Fecha y hora máxima (exclusive).
     * @return Especificación lista para el repositorio.
     */
    public static Specification<AnotacionHistoria> conFiltros(String texto, Long historiaId, Integer mascotaId,
                                                              Long medicoId, LocalDateTime desde,
                                                              LocalDateTime hastaExclusivo) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            if (historiaId != null) {
                filtros.add(cb.equal(root.get("historia").get("id"), historiaId));
            }
            if (mascotaId != null) {
                filtros.add(cb.equal(root.get("historia").get("mascota").get("mascotaId"), mascotaId));
            }
            if (medicoId != null) {
                filtros.add(cb.equal(root.get("medico").get("id"), medicoId));
            }
            if (desde != null) {
                filtros.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get("fecha"), desde));
            }
            if (hastaExclusivo != null) {
                filtros.add(cb.lessThan(root.<LocalDateTime>get("fecha"), hastaExclusivo));
            }
            if (texto != null && !texto.isBlank()) {
                String patron = "%" + texto.trim().toLowerCase() + "%";
                Join<?, ?> medico = root.join("medico", JoinType.LEFT);
                filtros.add(cb.or(
                        cb.like(cb.lower(root.<String>get("descripcion")), patron),
                        cb.like(cb.lower(root.<String>get("observacion")), patron),
                        cb.like(cb.lower(root.<String>get("diagnosticoEvolucion")), patron),
                        cb.like(nombreCompleto(cb, medico.get("nombres"), medico.get("apellidos")), patron)));
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
