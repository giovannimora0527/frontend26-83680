package com.uniminuto.clinica.repository.spec;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
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
 * Construye de forma dinámica los filtros del listado de citas. Cada criterio es opcional:
 * solo se agrega al WHERE si el usuario lo envió.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
public final class CitaSpecifications {

    /** Clase utilitaria: no se instancia. */
    private CitaSpecifications() {
    }

    /**
     * Combina todos los filtros opcionales del listado de citas.
     *
     * @param texto          Texto libre; busca en nombre del cliente, de la mascota y del veterinario.
     * @param estado         Estado exacto de la cita.
     * @param clienteId      Identificador del cliente.
     * @param mascotaId      Identificador de la mascota.
     * @param medicoId       Identificador del veterinario.
     * @param desde          Fecha y hora mínima (inclusive).
     * @param hastaExclusivo Fecha y hora máxima (exclusive).
     * @return Especificación lista para usar en el repositorio.
     */
    public static Specification<Cita> conFiltros(String texto, String estado, Long clienteId,
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
                Join<Cita, Cliente> cliente = root.join("cliente", JoinType.LEFT);
                Join<Cita, Mascota> mascota = root.join("mascota", JoinType.LEFT);
                Join<Cita, Medico> medico = root.join("medico", JoinType.LEFT);
                filtros.add(cb.or(
                        cb.like(nombreCompleto(cb, cliente.<String>get("nombres"), cliente.<String>get("apellidos")), patron),
                        cb.like(cb.lower(mascota.<String>get("nombreMascota")), patron),
                        cb.like(nombreCompleto(cb, medico.<String>get("nombres"), medico.<String>get("apellidos")), patron)));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }

    /**
     * Arma la expresión "nombres apellidos" en minúscula para buscar por nombre completo.
     *
     * @param cb        Constructor de criterios.
     * @param nombres   Expresión de la columna nombres.
     * @param apellidos Expresión de la columna apellidos.
     * @return Expresión concatenada en minúscula.
     */
    private static Expression<String> nombreCompleto(CriteriaBuilder cb,
                                                     Expression<String> nombres,
                                                     Expression<String> apellidos) {
        return cb.lower(cb.concat(cb.concat(nombres, " "), apellidos));
    }
}
