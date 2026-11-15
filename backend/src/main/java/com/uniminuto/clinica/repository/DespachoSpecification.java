package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Despacho;
import com.uniminuto.clinica.entity.DespachoDetalle;
import com.uniminuto.clinica.entity.EstadoEntrega;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.models.DespachoFiltroRq;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Construye la consulta dinámica del historial de despachos.
 */
public final class DespachoSpecification {

    /**
     * Clase utilitaria: no se instancia.
     */
    private DespachoSpecification() {
    }

    /**
     * Arma la especificación con los filtros recibidos.
     *
     * @param filtro filtros del historial.
     * @param estado estado de la entrega ya convertido (null = todos).
     * @return especificación para el repositorio.
     */
    public static Specification<Despacho> conFiltros(DespachoFiltroRq filtro, EstadoEntrega estado) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            Join<Despacho, FormulaMedica> formula = root.join("formula");
            Join<FormulaMedica, HistoriaClinica> historia = formula.join("historia");
            Join<HistoriaClinica, Mascota> mascota = historia.join("mascota");
            Join<Mascota, Cliente> cliente = mascota.join("cliente");

            String texto = filtro.getTexto();
            if (texto != null && !texto.isBlank()) {
                String limpio = texto.trim().toLowerCase();
                String patron = "%" + limpio + "%";
                Subquery<Long> porMedicamento = query.subquery(Long.class);
                Root<DespachoDetalle> linea = porMedicamento.from(DespachoDetalle.class);
                porMedicamento.select(linea.get("detalleId")).where(
                        cb.equal(linea.get("despacho"), root),
                        cb.like(cb.lower(linea.get("lote").get("medicamento").<String>get("nombre")), patron));
                List<Predicate> opciones = new ArrayList<>(List.of(
                        cb.like(cb.lower(mascota.<String>get("nombreMascota")), patron),
                        cb.like(cb.lower(cb.concat(cb.concat(cliente.<String>get("nombres"), " "),
                                cliente.<String>get("apellidos"))), patron),
                        cb.exists(porMedicamento)));
                if (limpio.matches("\\d{1,18}")) {
                    opciones.add(cb.equal(formula.get("formulaId"), Long.valueOf(limpio)));
                    opciones.add(cb.equal(root.get("despachoId"), Long.valueOf(limpio)));
                }
                filtros.add(cb.or(opciones.toArray(new Predicate[0])));
            }
            if (estado != null) {
                filtros.add(cb.equal(root.get("estado"), estado));
            }
            if (filtro.getMedicamentoId() != null) {
                Subquery<Long> conMedicamento = query.subquery(Long.class);
                Root<DespachoDetalle> linea = conMedicamento.from(DespachoDetalle.class);
                conMedicamento.select(linea.get("detalleId")).where(
                        cb.equal(linea.get("despacho"), root),
                        cb.equal(linea.get("lote").get("medicamento").get("id"), filtro.getMedicamentoId()));
                filtros.add(cb.exists(conMedicamento));
            }
            if (filtro.getDesde() != null) {
                filtros.add(cb.greaterThanOrEqualTo(root.get("fecha"), filtro.getDesde().atStartOfDay()));
            }
            if (filtro.getHasta() != null) {
                filtros.add(cb.lessThan(root.get("fecha"), filtro.getHasta().plusDays(1).atStartOfDay()));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }
}
