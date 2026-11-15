package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.AtencionServicio;
import com.uniminuto.clinica.entity.EstadoEntrega;
import com.uniminuto.clinica.entity.EstadoFormula;
import com.uniminuto.clinica.entity.FormulaDetalle;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.models.LineaCobroRs;
import com.uniminuto.clinica.repository.AtencionServicioRepository;
import com.uniminuto.clinica.repository.DespachoDetalleRepository;
import com.uniminuto.clinica.repository.FormulaRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.util.Dinero;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Arma las líneas de cobro de una atención y calcula subtotal, descuento, IVA y total.
 * <ul>
 *     <li>Servicios: los registrados en la atención, con la tarifa congelada al agregarlos.</li>
 *     <li>Prefactura: medicamentos formulados (fórmulas confirmadas) al precio de venta actual.</li>
 *     <li>Factura: solo los medicamentos efectivamente dispensados (entregas confirmadas).</li>
 *     <li>El descuento se reparte entre las líneas en proporción a su subtotal y el IVA se
 *         calcula sobre el valor ya descontado de cada línea.</li>
 * </ul>
 */
@Component
public class CalculoCobro {

    /**
     * Totales de un documento de cobro.
     *
     * @param subtotal  suma de subtotales.
     * @param descuento descuento total.
     * @param iva       IVA total.
     * @param total     total a pagar.
     */
    public record Totales(BigDecimal subtotal, BigDecimal descuento, BigDecimal iva, BigDecimal total) {
    }

    /** Servicios de las atenciones. */
    @Autowired
    private AtencionServicioRepository atencionServicioRepository;

    /** Fórmulas. */
    @Autowired
    private FormulaRepository formulaRepository;

    /** Entregas de medicamentos. */
    @Autowired
    private DespachoDetalleRepository despachoDetalleRepository;

    /** Productos del inventario. */
    @Autowired
    private MedicamentoRepository medicamentoRepository;

    /**
     * Líneas de los servicios prestados en la atención.
     *
     * @param historiaId atención.
     * @return líneas sin descuento.
     */
    public List<LineaCobroRs> servicios(Long historiaId) {
        List<LineaCobroRs> lineas = new ArrayList<>();
        for (AtencionServicio s : atencionServicioRepository.findByHistoria_HistoriaIdOrderByAtencionServicioIdAsc(historiaId)) {
            LineaCobroRs l = this.linea("SERVICIO", s.getServicio().getCodigo(), s.getServicio().getNombre(),
                    s.getCantidad(), s.getValorUnitario(), s.getIvaPorcentaje());
            l.setAtencionServicioId(s.getAtencionServicioId());
            l.setServicioId(s.getServicio().getServicioId());
            l.setObservacion(s.getObservacion());
            lineas.add(l);
        }
        return lineas;
    }

    /**
     * Medicamentos formulados en la atención (fórmulas confirmadas), agrupados por producto.
     *
     * @param historiaId atención.
     * @return líneas sin descuento.
     */
    public List<LineaCobroRs> medicamentosFormulados(Long historiaId) {
        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        Map<Long, Medicamento> productos = new LinkedHashMap<>();
        for (FormulaMedica f : formulaRepository.findByHistoria_HistoriaIdOrderByFormulaIdAsc(historiaId)) {
            if (f.getEstado() != EstadoFormula.CONFIRMADA) {
                continue;
            }
            for (FormulaDetalle d : f.getDetalles()) {
                cantidades.merge(d.getMedicamento().getId(), d.getCantidadPrescrita(), Integer::sum);
                productos.putIfAbsent(d.getMedicamento().getId(), d.getMedicamento());
            }
        }
        return this.lineasMedicamentos(cantidades, productos);
    }

    /**
     * Medicamentos efectivamente dispensados para la atención, agrupados por producto.
     *
     * @param historiaId atención.
     * @return líneas sin descuento.
     */
    public List<LineaCobroRs> medicamentosDispensados(Long historiaId) {
        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        for (Object[] fila : despachoDetalleRepository.sumarDispensadoPorAtencion(historiaId, EstadoEntrega.CONFIRMADO)) {
            cantidades.put((Long) fila[0], ((Number) fila[1]).intValue());
        }
        Map<Long, Medicamento> productos = new LinkedHashMap<>();
        medicamentoRepository.findAllById(cantidades.keySet()).forEach(m -> productos.put(m.getId(), m));
        return this.lineasMedicamentos(cantidades, productos);
    }

    /**
     * Reparte el descuento, calcula el IVA y el total de cada línea y devuelve los totales.
     *
     * @param lineas    líneas (se modifican).
     * @param descuento descuento total (0 si no hay).
     * @return totales del documento.
     */
    public Totales calcular(List<LineaCobroRs> lineas, BigDecimal descuento) {
        BigDecimal subtotal = Dinero.redondear(lineas.stream().map(LineaCobroRs::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        BigDecimal desc = Dinero.redondear(descuento);
        BigDecimal restante = desc;
        BigDecimal iva = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        for (int i = 0; i < lineas.size(); i++) {
            LineaCobroRs l = lineas.get(i);
            BigDecimal descLinea;
            if (subtotal.signum() == 0) {
                descLinea = BigDecimal.ZERO;
            } else if (i == lineas.size() - 1) {
                descLinea = restante;
            } else {
                descLinea = l.getSubtotal().multiply(desc).divide(subtotal, 2, RoundingMode.HALF_UP);
            }
            restante = restante.subtract(descLinea);
            BigDecimal base = l.getSubtotal().subtract(descLinea);
            BigDecimal ivaLinea = Dinero.porcentaje(base, l.getIvaPorcentaje());
            l.setDescuento(descLinea);
            l.setIva(ivaLinea);
            l.setTotal(Dinero.redondear(base.add(ivaLinea)));
            iva = iva.add(ivaLinea);
            total = total.add(l.getTotal());
        }
        return new Totales(subtotal, desc, Dinero.redondear(iva), Dinero.redondear(total));
    }

    /**
     * Convierte cantidades por producto en líneas ordenadas por nombre.
     */
    private List<LineaCobroRs> lineasMedicamentos(Map<Long, Integer> cantidades, Map<Long, Medicamento> productos) {
        List<LineaCobroRs> lineas = new ArrayList<>();
        cantidades.forEach((id, cantidad) -> {
            Medicamento m = productos.get(id);
            if (m == null || cantidad == null || cantidad <= 0) {
                return;
            }
            LineaCobroRs l = this.linea("MEDICAMENTO", m.getCodigo(), m.getNombre(), cantidad,
                    m.getPrecioVenta() == null ? BigDecimal.ZERO : m.getPrecioVenta(),
                    m.getIvaPorcentaje() == null ? BigDecimal.ZERO : m.getIvaPorcentaje());
            l.setMedicamentoId(id);
            if (m.getPrecioVenta() == null) {
                l.setObservacion("Sin precio de venta en el inventario");
            }
            lineas.add(l);
        });
        lineas.sort(Comparator.comparing(LineaCobroRs::getDescripcion));
        return lineas;
    }

    /**
     * Crea una línea sin descuento con su subtotal.
     */
    private LineaCobroRs linea(String tipo, String codigo, String descripcion, int cantidad, BigDecimal valor,
                               BigDecimal ivaPorcentaje) {
        LineaCobroRs l = new LineaCobroRs();
        l.setTipo(tipo);
        l.setCodigo(codigo);
        l.setDescripcion(descripcion);
        l.setCantidad(cantidad);
        l.setValorUnitario(Dinero.redondear(valor));
        l.setIvaPorcentaje(ivaPorcentaje);
        l.setSubtotal(Dinero.redondear(valor.multiply(BigDecimal.valueOf(cantidad))));
        l.setDescuento(BigDecimal.ZERO);
        return l;
    }
}
