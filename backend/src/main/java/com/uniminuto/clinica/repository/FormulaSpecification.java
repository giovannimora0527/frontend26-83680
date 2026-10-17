package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.EstadoFormula;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.HistoriaClinica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.models.FormulaFiltroRq;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Construye la consulta dinámica del listado de fórmulas: cada filtro solo se
 * aplica si el usuario lo envió.
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
     * @param filtro filtros del listado.
     * @param estado estado ya convertido (null = todos).
     * @return especificación para el repositorio.
     */
    public static Specification<FormulaMedica> conFiltros(FormulaFiltroRq filtro, EstadoFormula estado) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();

            Join<FormulaMedica, HistoriaClinica> historia = root.join("historia");
            Join<HistoriaClinica, Mascota> mascota = historia.join("mascota");
            Join<Mascota, Cliente> cliente = mascota.join("cliente");
            Join<FormulaMedica, Medico> medico = root.join("medico");
            Join<FormulaMedica, Medicamento> medicamento = root.join("medicamento");

            String texto = filtro.getTexto();
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
                        cb.like(cb.lower(medicamento.<String>get("nombre")), patron)));
            }
            if (estado != null) {
                filtros.add(cb.equal(root.get("estado"), estado));
            }
            if (filtro.getMedicoId() != null) {
                filtros.add(cb.equal(medico.get("id"), filtro.getMedicoId()));
            }
            if (filtro.getMedicamentoId() != null) {
                filtros.add(cb.equal(medicamento.get("id"), filtro.getMedicamentoId()));
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
