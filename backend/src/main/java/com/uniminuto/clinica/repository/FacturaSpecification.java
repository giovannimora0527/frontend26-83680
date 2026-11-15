package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.EstadoFactura;
import com.uniminuto.clinica.entity.Factura;
import com.uniminuto.clinica.models.FacturaFiltroRq;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Filtros dinámicos del listado de facturas.
 */
public final class FacturaSpecification {

    private FacturaSpecification() {
    }

    /**
     * Construye la condición de búsqueda.
     *
     * @param filtro filtros recibidos.
     * @param estado estado ya convertido (null = todos).
     * @return especificación.
     */
    public static Specification<Factura> conFiltros(FacturaFiltroRq filtro, EstadoFactura estado) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (filtro.getTexto() != null && !filtro.getTexto().isBlank()) {
                String like = "%" + filtro.getTexto().trim().toLowerCase() + "%";
                var cliente = root.join("cliente");
                var mascota = root.join("mascota");
                p.add(cb.or(
                        cb.like(cb.lower(root.get("numero")), like),
                        cb.like(cb.lower(cb.concat(cb.concat(cliente.get("nombres"), " "), cliente.get("apellidos"))), like),
                        cb.like(cb.lower(cliente.get("numeroDocumento")), like),
                        cb.like(cb.lower(mascota.get("nombreMascota")), like)));
            }
            if (estado != null) {
                p.add(cb.equal(root.get("estado"), estado));
            }
            if (filtro.getClienteId() != null) {
                p.add(cb.equal(root.get("cliente").get("clienteId"), filtro.getClienteId()));
            }
            if (filtro.getMascotaId() != null) {
                p.add(cb.equal(root.get("mascota").get("mascotaId"), filtro.getMascotaId()));
            }
            if (filtro.getDesde() != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("fecha"), filtro.getDesde().atStartOfDay()));
            }
            if (filtro.getHasta() != null) {
                p.add(cb.lessThan(root.get("fecha"), filtro.getHasta().plusDays(1).atStartOfDay()));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
    }
}
