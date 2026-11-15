package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.EstadoDespacho;
import com.uniminuto.clinica.entity.EstadoFormula;
import com.uniminuto.clinica.entity.FormulaDetalle;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.models.FormulaFiltroRq;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Construye la consulta dinámica del listado de fórmulas: cada filtro solo se
 * aplica si el usuario lo envió. Los filtros por medicamento usan una
 * subconsulta para no repetir fórmulas con varias líneas.
 */
public final class FormulaSpecification {

    /**
     * Clase utilitaria: no se instancia.
     */
    private FormulaSpecification() {
    }

    /**
     * Arma la especificación con los filtros recibidos.
     *
     * @param filtro         filtros del listado.
     * @param estado         estado de la fórmula ya convertido (null = todos).
     * @param estadoDespacho estado del despacho ya convertido (null = todos).
     * @return especificación para el repositorio.
     */
    public static Specification<FormulaMedica> conFiltros(FormulaFiltroRq filtro, EstadoFormula estado,
                                                          EstadoDespacho estadoDespacho) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();

            Join<FormulaMedica, HistoriaClinica> historia = root.join("historia");
            Join<HistoriaClinica, Mascota> mascota = historia.join("mascota");
            Join<Mascota, Cliente> cliente = mascota.join("cliente");
            Join<FormulaMedica, Medico> medico = root.join("medico");

            String texto = filtro.getTexto();
            if (texto != null && !texto.isBlank()) {
                String limpio = texto.trim().toLowerCase();
                String patron = "%" + limpio + "%";
                Subquery<Long> porMedicamento = query.subquery(Long.class);
                Root<FormulaDetalle> linea = porMedicamento.from(FormulaDetalle.class);
                Join<FormulaDetalle, Medicamento> producto = linea.join("medicamento");
                porMedicamento.select(linea.get("detalleId")).where(
                        cb.equal(linea.get("formula"), root),
                        cb.like(cb.lower(producto.<String>get("nombre")), patron));

                List<Predicate> opciones = new ArrayList<>(List.of(
                        cb.like(cb.lower(mascota.<String>get("nombreMascota")), patron),
                        cb.like(cb.lower(cb.concat(cb.concat(cliente.<String>get("nombres"), " "),
                                cliente.<String>get("apellidos"))), patron),
                        cb.like(cb.lower(cb.concat(cb.concat(medico.<String>get("nombres"), " "),
                                medico.<String>get("apellidos"))), patron),
                        cb.exists(porMedicamento)));
                if (limpio.matches("\\d{1,18}")) {
                    opciones.add(cb.equal(root.get("formulaId"), Long.valueOf(limpio)));
                }
                filtros.add(cb.or(opciones.toArray(new Predicate[0])));
            }
            if (estado != null) {
                filtros.add(cb.equal(root.get("estado"), estado));
            }
            if (estadoDespacho != null) {
                filtros.add(cb.equal(root.get("estadoDespacho"), estadoDespacho));
            }
            if (filtro.isPendientesDespacho()) {
                filtros.add(cb.equal(root.get("estado"), EstadoFormula.CONFIRMADA));
                filtros.add(root.get("estadoDespacho").in(EstadoDespacho.POR_ENTREGAR));
            }
            if (filtro.getMedicoId() != null) {
                filtros.add(cb.equal(medico.get("id"), filtro.getMedicoId()));
            }
            if (filtro.getMedicamentoId() != null) {
                Subquery<Long> conMedicamento = query.subquery(Long.class);
                Root<FormulaDetalle> linea = conMedicamento.from(FormulaDetalle.class);
                conMedicamento.select(linea.get("detalleId")).where(
                        cb.equal(linea.get("formula"), root),
                        cb.equal(linea.get("medicamento").get("id"), filtro.getMedicamentoId()));
                filtros.add(cb.exists(conMedicamento));
            }
            if (filtro.getMascotaId() != null) {
                filtros.add(cb.equal(mascota.get("mascotaId"), filtro.getMascotaId()));
            }
            if (filtro.getHistoriaId() != null) {
                filtros.add(cb.equal(historia.get("historiaId"), filtro.getHistoriaId()));
            }
            if (filtro.getDesde() != null) {
                filtros.add(cb.greaterThanOrEqualTo(root.get("fechaEmision"), filtro.getDesde()));
            }
            if (filtro.getHasta() != null) {
                filtros.add(cb.lessThanOrEqualTo(root.get("fechaEmision"), filtro.getHasta()));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }
}
