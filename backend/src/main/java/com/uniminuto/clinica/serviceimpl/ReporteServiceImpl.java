package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.exception.SinPermisoException;
import com.uniminuto.clinica.models.ReporteDefRs;
import com.uniminuto.clinica.models.ReporteFiltroRq;
import com.uniminuto.clinica.models.ReporteRs;
import com.uniminuto.clinica.models.ReporteRs.Columna;
import com.uniminuto.clinica.service.ReporteService;
import com.uniminuto.clinica.util.ExcelDocumentos;
import com.uniminuto.clinica.util.PdfDocumentos;
import com.uniminuto.clinica.util.UsuarioActual;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.BiFunction;

/**
 * Motor de reportes: cada reporte tiene un código, los perfiles que lo pueden
 * generar, los filtros que admite y su consulta SQL de agregación. La vista
 * previa, el PDF y el Excel usan exactamente el mismo resultado, de modo que lo
 * que se ve es lo que se exporta. Los valores financieros salen de las facturas
 * (sin las anuladas) y los pagos registrados.
 */
@Service
public class ReporteServiceImpl implements ReporteService {

    /** Días máximos del período de un reporte (tres años). */
    private static final int DIAS_MAXIMOS = 1096;

    /** Perfiles de los reportes financieros y de inventario. */
    private static final Set<String> ADMIN = Set.of("ADMIN");

    /** Perfiles de los reportes de gestión médica. */
    private static final Set<String> GESTION = Set.of("ADMIN", "RECEPCIONISTA");

    /** Condición de facturas vigentes en un rango. */
    private static final String FACTURAS_RANGO = " f.estado <> 'ANULADA' AND f.fecha >= :desde AND f.fecha < :hasta ";

    /** Nombre completo del veterinario. */
    private static final String MEDICO = "CONCAT(me.nombres, ' ', me.apellidos)";

    /** Nombre completo del propietario. */
    private static final String CLIENTE = "CONCAT(c.nombres, ' ', c.apellidos)";

    /**
     * Definición de un reporte.
     *
     * @param codigo      código.
     * @param nombre      nombre.
     * @param categoria   categoría.
     * @param descripcion descripción.
     * @param roles       perfiles que lo pueden generar.
     * @param filtros     filtros que admite.
     * @param generador   consulta que arma el resultado.
     */
    private record Definicion(String codigo, String nombre, String categoria, String descripcion, Set<String> roles,
                              List<String> filtros, BiFunction<ReporteFiltroRq, ReporteRs, ReporteRs> generador) {
    }

    /** Consultas SQL. */
    @Autowired
    private NamedParameterJdbcTemplate jdbc;

    /** Usuario autenticado. */
    @Autowired
    private UsuarioActual usuarioActual;

    /** Generador de PDF. */
    @Autowired
    private PdfDocumentos pdf;

    /** Generador de Excel. */
    @Autowired
    private ExcelDocumentos excel;

    /** Reportes disponibles, en el orden en que se muestran. */
    private final Map<String, Definicion> definiciones = new LinkedHashMap<>();

    /**
     * Registra los reportes.
     */
    public ReporteServiceImpl() {
        String fin = "Financiero";
        String inv = "Inventario";
        String med = "Gestión médica";
        List<String> fechas = List.of("fechas");
        this.def("ingresos-periodo", "Ingresos por período", fin, "Pagos recibidos agrupados por día, mes o año, por medio de pago",
                ADMIN, List.of("fechas", "agrupacion"), this::ingresosPeriodo);
        this.def("ingresos-consultas", "Ingresos por consultas médicas", fin, "Consultas facturadas por tipo de consulta",
                ADMIN, List.of("fechas", "medico"), this::ingresosConsultas);
        this.def("ingresos-especialidad", "Ingresos por especialidad", fin, "Facturación agrupada por especialidad",
                ADMIN, fechas, this::ingresosEspecialidad);
        this.def("ingresos-veterinario", "Ingresos por veterinario", fin, "Facturación agrupada por veterinario",
                ADMIN, List.of("fechas", "especialidad"), this::ingresosVeterinario);
        this.def("ingresos-medicamentos", "Ingresos por venta de medicamentos", fin, "Medicamentos y productos facturados",
                ADMIN, List.of("fechas", "medicamento"), this::ingresosMedicamentos);
        this.def("facturas", "Facturas generadas", fin, "Facturas del período (pagadas, pendientes, parciales o anuladas)",
                ADMIN, List.of("fechas", "estadoFactura"), this::facturas);
        this.def("facturas-estado", "Resumen de facturas por estado", fin, "Total de facturas, pagadas, pendientes y pagos parciales",
                ADMIN, fechas, this::facturasEstado);
        this.def("impuestos", "Impuestos registrados", fin, "Base gravable e IVA por tarifa", ADMIN, fechas, this::impuestos);
        this.def("descuentos", "Descuentos aplicados", fin, "Facturas con descuento autorizado", ADMIN, fechas, this::descuentos);

        this.def("existencias", "Existencias actuales", inv, "Existencias, valor a costo de adquisición y valor potencial de venta",
                ADMIN, List.of(), (f, r) -> this.existencias(f, r, null));
        this.def("agotados", "Medicamentos agotados", inv, "Productos activos sin existencias vigentes",
                ADMIN, List.of(), (f, r) -> this.existencias(f, r, "AGOTADO"));
        this.def("stock-minimo", "Medicamentos en stock mínimo", inv, "Productos con existencias en o por debajo del mínimo",
                ADMIN, List.of(), (f, r) -> this.existencias(f, r, "BAJO"));
        this.def("proximos-vencer", "Medicamentos próximos a vencer", inv, "Lotes con existencias que vencen en los próximos días",
                ADMIN, List.of("dias"), this::proximosVencer);
        this.def("vencidos", "Medicamentos vencidos", inv, "Lotes vencidos que aún tienen unidades", ADMIN, List.of(), this::vencidos);
        this.def("movimientos", "Entradas y salidas de inventario", inv, "Movimientos del período; con medicamento es su historial",
                ADMIN, List.of("fechas", "medicamento"), this::movimientos);

        this.def("citas-periodo", "Número de citas por período", med, "Citas agrupadas por período y estado",
                GESTION, List.of("fechas", "agrupacion", "medico"), this::citasPeriodo);
        this.def("citas-detalle", "Citas por estado", med, "Listado de citas atendidas, canceladas o pendientes",
                GESTION, List.of("fechas", "estadoCita", "medico"), this::citasDetalle);
        this.def("consultas-veterinario", "Consultas realizadas por veterinario", med, "Atenciones registradas por veterinario",
                GESTION, fechas, this::consultasVeterinario);
        this.def("consultas-especialidad", "Consultas realizadas por especialidad", med, "Atenciones registradas por especialidad",
                GESTION, fechas, this::consultasEspecialidad);
        this.def("mascotas-atendidas", "Mascotas atendidas por período", med, "Mascotas con al menos una atención en el período",
                GESTION, fechas, this::mascotasAtendidas);
    }

    private void def(String codigo, String nombre, String categoria, String descripcion, Set<String> roles,
                     List<String> filtros, BiFunction<ReporteFiltroRq, ReporteRs, ReporteRs> generador) {
        definiciones.put(codigo, new Definicion(codigo, nombre, categoria, descripcion, roles, filtros, generador));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<ReporteDefRs> catalogo() {
        String rol = usuarioActual.obtener().getRol();
        return definiciones.values().stream().filter(d -> d.roles().contains(rol))
                .map(d -> new ReporteDefRs(d.codigo(), d.nombre(), d.categoria(), d.descripcion(), d.filtros())).toList();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ReporteRs generar(String codigo, ReporteFiltroRq filtro) {
        Definicion d = definiciones.get(codigo);
        if (d == null) {
            throw new NotFoundException("El reporte '" + codigo + "' no existe");
        }
        Usuario usuario = usuarioActual.obtener();
        if (!d.roles().contains(usuario.getRol())) {
            throw new SinPermisoException("Su perfil no tiene acceso al reporte " + d.nombre());
        }
        ReporteFiltroRq f = filtro == null ? new ReporteFiltroRq() : filtro;
        if (d.filtros().contains("fechas")) {
            if (f.getDesde() == null) {
                f.setDesde(LocalDate.now().withDayOfMonth(1));
            }
            if (f.getHasta() == null) {
                f.setHasta(LocalDate.now());
            }
            if (f.getDesde().isAfter(f.getHasta())) {
                throw new BadRequestException("La fecha inicial no puede ser posterior a la fecha final");
            }
            if (ChronoUnit.DAYS.between(f.getDesde(), f.getHasta()) > DIAS_MAXIMOS) {
                throw new BadRequestException("El período no puede superar tres años");
            }
        }
        ReporteRs r = new ReporteRs();
        r.setCodigo(d.codigo());
        r.setTitulo(d.nombre());
        r.setCategoria(d.categoria());
        r.setGenerado(LocalDateTime.now());
        r.setUsuario(usuario.getUsername());
        r.setTotales(new LinkedHashMap<>());
        r.setResumen(new LinkedHashMap<>());
        List<String> partes = new ArrayList<>();
        if (d.filtros().contains("fechas")) {
            partes.add("Período: " + f.getDesde() + " a " + f.getHasta());
        }
        r.setFiltrosAplicados(String.join(" · ", partes));
        d.generador().apply(f, r);
        return r;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public byte[] pdf(String codigo, ReporteFiltroRq filtro) {
        return pdf.reporte(this.generar(codigo, filtro));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public byte[] excel(String codigo, ReporteFiltroRq filtro) {
        return excel.reporte(this.generar(codigo, filtro));
    }

    // ===================== Financieros =====================

    private ReporteRs ingresosPeriodo(ReporteFiltroRq f, ReporteRs r) {
        String formato = this.formatoPeriodo(f, r);
        String sql = "SELECT DATE_FORMAT(p.fecha, '" + formato + "') periodo, COUNT(*) pagos, "
                + "SUM(CASE WHEN p.medio = 'EFECTIVO' THEN p.valor ELSE 0 END) efectivo, "
                + "SUM(CASE WHEN p.medio IN ('TARJETA_DEBITO', 'TARJETA_CREDITO') THEN p.valor ELSE 0 END) tarjetas, "
                + "SUM(CASE WHEN p.medio = 'TRANSFERENCIA' THEN p.valor ELSE 0 END) transferencias, SUM(p.valor) total "
                + "FROM pago p WHERE p.fecha >= :desde AND p.fecha < :hasta GROUP BY periodo ORDER BY periodo";
        return this.llenar(r, sql, this.rango(f),
                List.of(col("periodo", "Período", "TEXTO"), col("pagos", "Pagos", "ENTERO"), col("efectivo", "Efectivo", "MONEDA"),
                        col("tarjetas", "Tarjetas", "MONEDA"), col("transferencias", "Transferencias", "MONEDA"),
                        col("total", "Total recibido", "MONEDA")),
                "pagos", "efectivo", "tarjetas", "transferencias", "total");
    }

    private ReporteRs ingresosConsultas(ReporteFiltroRq f, ReporteRs r) {
        MapSqlParameterSource p = this.rango(f);
        String extra = this.filtroMedico(f, p, r, "f.medico_id");
        String sql = "SELECT s.codigo, s.nombre servicio, SUM(d.cantidad) cantidad, SUM(d.subtotal) subtotal, "
                + "SUM(d.descuento) descuento, SUM(d.iva) iva, SUM(d.total) total "
                + "FROM factura_detalle d JOIN factura f ON f.factura_id = d.factura_id JOIN servicio s ON s.servicio_id = d.servicio_id "
                + "WHERE d.tipo = 'SERVICIO' AND s.tipo = 'CONSULTA' AND" + FACTURAS_RANGO + extra
                + " GROUP BY s.codigo, s.nombre ORDER BY total DESC";
        return this.llenar(r, sql, p, List.of(col("codigo", "Código", "TEXTO"), col("servicio", "Consulta", "TEXTO"),
                col("cantidad", "Cantidad", "ENTERO"), col("subtotal", "Subtotal", "MONEDA"), col("descuento", "Descuento", "MONEDA"),
                col("iva", "IVA", "MONEDA"), col("total", "Total", "MONEDA")), "cantidad", "subtotal", "descuento", "iva", "total");
    }

    private ReporteRs ingresosEspecialidad(ReporteFiltroRq f, ReporteRs r) {
        String sql = "SELECT f.especialidad, COUNT(*) facturas, SUM(f.subtotal) subtotal, SUM(f.descuento) descuento, "
                + "SUM(f.iva) iva, SUM(f.total) total, SUM(f.pagado) pagado, SUM(f.total - f.pagado) saldo "
                + "FROM factura f WHERE" + FACTURAS_RANGO + "GROUP BY f.especialidad ORDER BY total DESC";
        return this.llenar(r, sql, this.rango(f), this.columnasFacturacion("especialidad", "Especialidad"),
                "facturas", "subtotal", "descuento", "iva", "total", "pagado", "saldo");
    }

    private ReporteRs ingresosVeterinario(ReporteFiltroRq f, ReporteRs r) {
        MapSqlParameterSource p = this.rango(f);
        String extra = "";
        if (f.getEspecializacionId() != null) {
            extra = " AND me.especializacion_id = :especializacionId ";
            p.addValue("especializacionId", f.getEspecializacionId());
            this.agregarFiltro(r, "Especialidad: " + this.nombre("SELECT nombre FROM especializacion WHERE id = ?",
                    f.getEspecializacionId()));
        }
        String sql = "SELECT " + MEDICO + " veterinario, COUNT(*) facturas, SUM(f.subtotal) subtotal, SUM(f.descuento) descuento, "
                + "SUM(f.iva) iva, SUM(f.total) total, SUM(f.pagado) pagado, SUM(f.total - f.pagado) saldo "
                + "FROM factura f JOIN medico me ON me.id = f.medico_id WHERE" + FACTURAS_RANGO + extra
                + "GROUP BY me.id, veterinario ORDER BY total DESC";
        return this.llenar(r, sql, p, this.columnasFacturacion("veterinario", "Veterinario"),
                "facturas", "subtotal", "descuento", "iva", "total", "pagado", "saldo");
    }

    private ReporteRs ingresosMedicamentos(ReporteFiltroRq f, ReporteRs r) {
        MapSqlParameterSource p = this.rango(f);
        String extra = this.filtroMedicamento(f, p, r, "d.medicamento_id");
        String sql = "SELECT m.codigo, m.nombre producto, SUM(d.cantidad) cantidad, SUM(d.subtotal) subtotal, "
                + "SUM(d.descuento) descuento, SUM(d.iva) iva, SUM(d.total) total "
                + "FROM factura_detalle d JOIN factura f ON f.factura_id = d.factura_id JOIN medicamento m ON m.id = d.medicamento_id "
                + "WHERE d.tipo = 'MEDICAMENTO' AND" + FACTURAS_RANGO + extra + " GROUP BY m.id, m.codigo, m.nombre ORDER BY total DESC";
        return this.llenar(r, sql, p, List.of(col("codigo", "Código", "TEXTO"), col("producto", "Producto", "TEXTO"),
                col("cantidad", "Unidades", "ENTERO"), col("subtotal", "Subtotal", "MONEDA"), col("descuento", "Descuento", "MONEDA"),
                col("iva", "IVA", "MONEDA"), col("total", "Total", "MONEDA")), "cantidad", "subtotal", "descuento", "iva", "total");
    }

    private ReporteRs facturas(ReporteFiltroRq f, ReporteRs r) {
        MapSqlParameterSource p = this.rango(f);
        String condicion = " f.fecha >= :desde AND f.fecha < :hasta ";
        if (f.getEstado() != null && !f.getEstado().isBlank()) {
            condicion += " AND f.estado = :estado ";
            p.addValue("estado", f.getEstado().trim().toUpperCase());
            this.agregarFiltro(r, "Estado: " + f.getEstado());
        }
        String sql = "SELECT f.numero, f.fecha, " + CLIENTE + " propietario, ma.nombre_mascota mascota, " + MEDICO + " veterinario, "
                + "f.total, f.pagado, CASE WHEN f.estado = 'ANULADA' THEN 0 ELSE f.total - f.pagado END saldo, "
                + "CASE f.estado WHEN 'PENDIENTE_PAGO' THEN 'Pendiente de pago' WHEN 'PAGO_PARCIAL' THEN 'Pago parcial' "
                + "WHEN 'PAGADA' THEN 'Pagada' ELSE 'Anulada' END estado "
                + "FROM factura f JOIN cliente c ON c.cliente_id = f.cliente_id JOIN mascota ma ON ma.mascota_id = f.mascota_id "
                + "JOIN medico me ON me.id = f.medico_id WHERE" + condicion + "ORDER BY f.fecha";
        this.llenar(r, sql, p, List.of(col("numero", "Número", "TEXTO"), col("fecha", "Fecha", "FECHA_HORA"),
                col("propietario", "Propietario", "TEXTO"), col("mascota", "Mascota", "TEXTO"), col("veterinario", "Veterinario", "TEXTO"),
                col("total", "Total", "MONEDA"), col("pagado", "Pagado", "MONEDA"), col("saldo", "Saldo", "MONEDA"),
                col("estado", "Estado", "TEXTO")));
        // Los totales no suman las facturas anuladas.
        List<Map<String, Object>> vigentes = r.getFilas().stream().filter(x -> !"Anulada".equals(x.get("estado"))).toList();
        r.getTotales().put("total", this.sumar(vigentes, "total"));
        r.getTotales().put("pagado", this.sumar(vigentes, "pagado"));
        r.getTotales().put("saldo", this.sumar(vigentes, "saldo"));
        r.getResumen().put("Facturas", r.getFilas().size());
        r.getResumen().put("Anuladas (no suman)", r.getFilas().size() - vigentes.size());
        return r;
    }

    private ReporteRs facturasEstado(ReporteFiltroRq f, ReporteRs r) {
        String sql = "SELECT CASE f.estado WHEN 'PENDIENTE_PAGO' THEN 'Pendiente de pago' WHEN 'PAGO_PARCIAL' THEN 'Pago parcial' "
                + "WHEN 'PAGADA' THEN 'Pagada' ELSE 'Anulada' END estado, COUNT(*) facturas, SUM(f.total) total, SUM(f.pagado) pagado, "
                + "SUM(CASE WHEN f.estado = 'ANULADA' THEN 0 ELSE f.total - f.pagado END) saldo "
                + "FROM factura f WHERE f.fecha >= :desde AND f.fecha < :hasta GROUP BY f.estado ORDER BY FIELD(f.estado, "
                + "'PENDIENTE_PAGO', 'PAGO_PARCIAL', 'PAGADA', 'ANULADA')";
        this.llenar(r, sql, this.rango(f), List.of(col("estado", "Estado", "TEXTO"), col("facturas", "Facturas", "ENTERO"),
                col("total", "Total", "MONEDA"), col("pagado", "Pagado", "MONEDA"), col("saldo", "Saldo", "MONEDA")),
                "facturas", "pagado", "saldo");
        r.getResumen().put("Total facturado sin anuladas", this.sumar(r.getFilas().stream()
                .filter(x -> !"Anulada".equals(x.get("estado"))).toList(), "total"));
        return r;
    }

    private ReporteRs impuestos(ReporteFiltroRq f, ReporteRs r) {
        String sql = "SELECT CASE d.tipo WHEN 'SERVICIO' THEN 'Servicios' ELSE 'Medicamentos y productos' END tipo, "
                + "d.iva_porcentaje tarifa, SUM(d.subtotal - d.descuento) base, SUM(d.iva) iva, SUM(d.total) total "
                + "FROM factura_detalle d JOIN factura f ON f.factura_id = d.factura_id WHERE" + FACTURAS_RANGO
                + "GROUP BY d.tipo, d.iva_porcentaje ORDER BY d.tipo, d.iva_porcentaje";
        return this.llenar(r, sql, this.rango(f), List.of(col("tipo", "Concepto", "TEXTO"), col("tarifa", "Tarifa IVA", "PORCENTAJE"),
                col("base", "Base gravable", "MONEDA"), col("iva", "IVA", "MONEDA"), col("total", "Total", "MONEDA")),
                "base", "iva", "total");
    }

    private ReporteRs descuentos(ReporteFiltroRq f, ReporteRs r) {
        String sql = "SELECT f.numero, f.fecha, " + CLIENTE + " propietario, f.motivo_descuento motivo, f.subtotal, f.descuento, f.total "
                + "FROM factura f JOIN cliente c ON c.cliente_id = f.cliente_id WHERE" + FACTURAS_RANGO
                + "AND f.descuento > 0 ORDER BY f.fecha";
        return this.llenar(r, sql, this.rango(f), List.of(col("numero", "Número", "TEXTO"), col("fecha", "Fecha", "FECHA_HORA"),
                col("propietario", "Propietario", "TEXTO"), col("motivo", "Motivo", "TEXTO"), col("subtotal", "Subtotal", "MONEDA"),
                col("descuento", "Descuento", "MONEDA"), col("total", "Total", "MONEDA")), "subtotal", "descuento", "total");
    }

    // ===================== Inventario =====================

    private ReporteRs existencias(ReporteFiltroRq f, ReporteRs r, String soloEstado) {
        String sql = "SELECT m.codigo, m.nombre producto, m.tipo, "
                + "COALESCE(SUM(CASE WHEN l.fecha_vencimiento IS NULL OR l.fecha_vencimiento > CURDATE() THEN l.cantidad_disponible END), 0) disponible, "
                + "COALESCE(SUM(CASE WHEN l.fecha_vencimiento <= CURDATE() THEN l.cantidad_disponible END), 0) vencidas, "
                + "m.stock_minimo minimo, "
                + "COALESCE(SUM(CASE WHEN l.fecha_vencimiento IS NULL OR l.fecha_vencimiento > CURDATE() "
                + "THEN l.cantidad_disponible * COALESCE(l.precio_compra, 0) END), 0) costo, "
                + "COALESCE(m.precio_venta, 0) precio "
                + "FROM medicamento m LEFT JOIN lote_medicamento l ON l.medicamento_id = m.id WHERE m.activo = 1 "
                + "GROUP BY m.id, m.codigo, m.nombre, m.tipo, m.stock_minimo, m.precio_venta ORDER BY m.nombre";
        this.llenar(r, sql, new MapSqlParameterSource(), List.of(col("codigo", "Código", "TEXTO"), col("producto", "Producto", "TEXTO"),
                col("tipo", "Tipo", "TEXTO"), col("disponible", "Disponible", "ENTERO"), col("minimo", "Stock mínimo", "ENTERO"),
                col("estado", "Estado", "TEXTO"), col("vencidas", "Unid. vencidas", "ENTERO"), col("costo", "Valor a costo", "MONEDA"),
                col("precio", "Precio venta", "MONEDA"), col("venta", "Valor de venta", "MONEDA")));
        List<Map<String, Object>> filas = new ArrayList<>();
        for (Map<String, Object> fila : r.getFilas()) {
            long disponible = ((Number) fila.get("disponible")).longValue();
            long minimo = fila.get("minimo") == null ? 0 : ((Number) fila.get("minimo")).longValue();
            String estado = disponible == 0 ? "AGOTADO" : disponible <= minimo ? "BAJO" : "NORMAL";
            if (soloEstado != null && !soloEstado.equals(estado)) {
                continue;
            }
            fila.put("estado", "AGOTADO".equals(estado) ? "Agotado" : "BAJO".equals(estado) ? "Stock bajo" : "Normal");
            fila.put("venta", ((BigDecimal) fila.get("precio")).multiply(BigDecimal.valueOf(disponible)));
            filas.add(fila);
        }
        r.setFilas(filas);
        this.totalizar(r, "disponible", "vencidas", "costo", "venta");
        r.getResumen().put("Productos", filas.size());
        r.getResumen().put("Valor del inventario a costo", r.getTotales().get("costo"));
        r.getResumen().put("Valor potencial de venta", r.getTotales().get("venta"));
        r.setFiltrosAplicados("Existencias vigentes al " + LocalDate.now());
        return r;
    }

    private ReporteRs proximosVencer(ReporteFiltroRq f, ReporteRs r) {
        int dias = f.getDias() == null ? 60 : f.getDias();
        if (dias < 1 || dias > 365) {
            throw new BadRequestException("Los días deben estar entre 1 y 365");
        }
        String sql = this.sqlLotes() + "AND l.fecha_vencimiento > CURDATE() AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL :dias DAY) "
                + "ORDER BY l.fecha_vencimiento";
        this.llenar(r, sql, new MapSqlParameterSource("dias", dias), this.columnasLotes(), "disponible", "costo");
        r.setFiltrosAplicados("Lotes que vencen entre " + LocalDate.now().plusDays(1) + " y " + LocalDate.now().plusDays(dias));
        return r;
    }

    private ReporteRs vencidos(ReporteFiltroRq f, ReporteRs r) {
        String sql = this.sqlLotes() + "AND l.fecha_vencimiento <= CURDATE() ORDER BY l.fecha_vencimiento";
        this.llenar(r, sql, new MapSqlParameterSource(), this.columnasLotes(), "disponible", "costo");
        r.setFiltrosAplicados("Lotes vencidos con unidades al " + LocalDate.now());
        return r;
    }

    private ReporteRs movimientos(ReporteFiltroRq f, ReporteRs r) {
        MapSqlParameterSource p = this.rango(f);
        String extra = this.filtroMedicamento(f, p, r, "mv.medicamento_id");
        String sql = "SELECT mv.fecha, m.codigo, m.nombre producto, l.numero_lote lote, mv.tipo, "
                + "CASE WHEN mv.tipo IN ('ENTRADA', 'AJUSTE_ENTRADA', 'REVERSION') THEN mv.cantidad ELSE 0 END entradas, "
                + "CASE WHEN mv.tipo IN ('SALIDA', 'AJUSTE_SALIDA') THEN mv.cantidad ELSE 0 END salidas, "
                + "mv.saldo_lote saldo, u.username usuario, mv.referencia "
                + "FROM movimiento_inventario mv JOIN medicamento m ON m.id = mv.medicamento_id "
                + "LEFT JOIN lote_medicamento l ON l.lote_id = mv.lote_id LEFT JOIN usuario u ON u.id = mv.usuario_id "
                + "WHERE mv.fecha >= :desde AND mv.fecha < :hasta" + extra + " ORDER BY mv.fecha, mv.movimiento_id";
        return this.llenar(r, sql, p, List.of(col("fecha", "Fecha", "FECHA_HORA"), col("codigo", "Código", "TEXTO"),
                col("producto", "Producto", "TEXTO"), col("lote", "Lote", "TEXTO"), col("tipo", "Tipo", "TEXTO"),
                col("entradas", "Entradas", "ENTERO"), col("salidas", "Salidas", "ENTERO"), col("saldo", "Saldo del lote", "ENTERO"),
                col("usuario", "Usuario", "TEXTO"), col("referencia", "Referencia", "TEXTO")), "entradas", "salidas");
    }

    // ===================== Gestión médica =====================

    private ReporteRs citasPeriodo(ReporteFiltroRq f, ReporteRs r) {
        String formato = this.formatoPeriodo(f, r);
        MapSqlParameterSource p = this.rango(f);
        String extra = this.filtroMedico(f, p, r, "ci.medico_id");
        String sql = "SELECT DATE_FORMAT(ci.fecha_hora, '" + formato + "') periodo, COUNT(*) total, "
                + "SUM(ci.estado IN ('PENDIENTE', 'PROGRAMADA')) pendientes, SUM(ci.estado = 'CONFIRMADA') confirmadas, "
                + "SUM(ci.estado = 'ATENDIDA') atendidas, SUM(ci.estado = 'CANCELADA') canceladas "
                + "FROM cita ci WHERE ci.fecha_hora >= :desde AND ci.fecha_hora < :hasta" + extra + " GROUP BY periodo ORDER BY periodo";
        return this.llenar(r, sql, p, List.of(col("periodo", "Período", "TEXTO"), col("total", "Citas", "ENTERO"),
                col("pendientes", "Pendientes", "ENTERO"), col("confirmadas", "Confirmadas", "ENTERO"),
                col("atendidas", "Atendidas", "ENTERO"), col("canceladas", "Canceladas", "ENTERO")),
                "total", "pendientes", "confirmadas", "atendidas", "canceladas");
    }

    private ReporteRs citasDetalle(ReporteFiltroRq f, ReporteRs r) {
        MapSqlParameterSource p = this.rango(f);
        String extra = this.filtroMedico(f, p, r, "ci.medico_id");
        if (f.getEstado() != null && !f.getEstado().isBlank()) {
            String e = f.getEstado().trim().toUpperCase();
            if ("PENDIENTES".equals(e)) {
                extra += " AND ci.estado IN ('PENDIENTE', 'PROGRAMADA', 'CONFIRMADA') ";
            } else {
                extra += " AND ci.estado = :estado ";
                p.addValue("estado", e);
            }
            this.agregarFiltro(r, "Estado: " + e);
        }
        String sql = "SELECT ci.cita_id cita, ci.fecha_hora inicio, ma.nombre_mascota mascota, " + CLIENTE + " propietario, "
                + MEDICO + " veterinario, ci.motivo, CASE ci.estado WHEN 'ATENDIDA' THEN 'Finalizada' WHEN 'CANCELADA' THEN 'Cancelada' "
                + "WHEN 'CONFIRMADA' THEN 'Confirmada' WHEN 'PROGRAMADA' THEN 'Programada' ELSE 'Pendiente' END estado "
                + "FROM cita ci JOIN mascota ma ON ma.mascota_id = ci.mascota_id JOIN cliente c ON c.cliente_id = ma.cliente_id "
                + "JOIN medico me ON me.id = ci.medico_id WHERE ci.fecha_hora >= :desde AND ci.fecha_hora < :hasta" + extra
                + " ORDER BY ci.fecha_hora";
        this.llenar(r, sql, p, List.of(col("cita", "N.°", "ENTERO"), col("inicio", "Fecha y hora", "FECHA_HORA"),
                col("mascota", "Mascota", "TEXTO"), col("propietario", "Propietario", "TEXTO"), col("veterinario", "Veterinario", "TEXTO"),
                col("motivo", "Motivo", "TEXTO"), col("estado", "Estado", "TEXTO")));
        r.getResumen().put("Citas", r.getFilas().size());
        return r;
    }

    private ReporteRs consultasVeterinario(ReporteFiltroRq f, ReporteRs r) {
        String sql = "SELECT " + MEDICO + " veterinario, es.nombre especialidad, COUNT(*) consultas, "
                + "SUM(h.estado = 'CERRADA') finalizadas, COUNT(DISTINCT h.mascota_id) mascotas "
                + "FROM historia_clinica h JOIN medico me ON me.id = h.medico_id JOIN especializacion es ON es.id = me.especializacion_id "
                + "WHERE h.fecha_hora >= :desde AND h.fecha_hora < :hasta GROUP BY me.id, veterinario, es.nombre ORDER BY consultas DESC";
        return this.llenar(r, sql, this.rango(f), List.of(col("veterinario", "Veterinario", "TEXTO"),
                col("especialidad", "Especialidad", "TEXTO"), col("consultas", "Consultas", "ENTERO"),
                col("finalizadas", "Finalizadas", "ENTERO"), col("mascotas", "Mascotas distintas", "ENTERO")),
                "consultas", "finalizadas");
    }

    private ReporteRs consultasEspecialidad(ReporteFiltroRq f, ReporteRs r) {
        String sql = "SELECT es.nombre especialidad, COUNT(*) consultas, SUM(h.estado = 'CERRADA') finalizadas, "
                + "COUNT(DISTINCT h.medico_id) veterinarios, COUNT(DISTINCT h.mascota_id) mascotas "
                + "FROM historia_clinica h JOIN medico me ON me.id = h.medico_id JOIN especializacion es ON es.id = me.especializacion_id "
                + "WHERE h.fecha_hora >= :desde AND h.fecha_hora < :hasta GROUP BY es.id, es.nombre ORDER BY consultas DESC";
        return this.llenar(r, sql, this.rango(f), List.of(col("especialidad", "Especialidad", "TEXTO"),
                col("consultas", "Consultas", "ENTERO"), col("finalizadas", "Finalizadas", "ENTERO"),
                col("veterinarios", "Veterinarios", "ENTERO"), col("mascotas", "Mascotas distintas", "ENTERO")),
                "consultas", "finalizadas");
    }

    private ReporteRs mascotasAtendidas(ReporteFiltroRq f, ReporteRs r) {
        String sql = "SELECT ma.nombre_mascota mascota, CONCAT(ra.nombre, ' (', ra.especie, ')') raza, " + CLIENTE + " propietario, "
                + "COUNT(*) consultas, MAX(h.fecha_hora) ultima "
                + "FROM historia_clinica h JOIN mascota ma ON ma.mascota_id = h.mascota_id JOIN cliente c ON c.cliente_id = ma.cliente_id "
                + "LEFT JOIN raza ra ON ra.raza_id = ma.raza_id "
                + "WHERE h.fecha_hora >= :desde AND h.fecha_hora < :hasta GROUP BY ma.mascota_id, mascota, raza, propietario "
                + "ORDER BY consultas DESC, mascota";
        this.llenar(r, sql, this.rango(f), List.of(col("mascota", "Mascota", "TEXTO"), col("raza", "Raza", "TEXTO"),
                col("propietario", "Propietario", "TEXTO"), col("consultas", "Consultas", "ENTERO"),
                col("ultima", "Última atención", "FECHA_HORA")), "consultas");
        r.getResumen().put("Mascotas atendidas", r.getFilas().size());
        return r;
    }

    // ===================== Utilidades =====================

    private static Columna col(String clave, String titulo, String tipo) {
        return new Columna(clave, titulo, tipo);
    }

    /** Columnas comunes de los reportes de facturación agrupada. */
    private List<Columna> columnasFacturacion(String clave, String titulo) {
        return List.of(col(clave, titulo, "TEXTO"), col("facturas", "Facturas", "ENTERO"), col("subtotal", "Subtotal", "MONEDA"),
                col("descuento", "Descuento", "MONEDA"), col("iva", "IVA", "MONEDA"), col("total", "Total facturado", "MONEDA"),
                col("pagado", "Pagado", "MONEDA"), col("saldo", "Saldo", "MONEDA"));
    }

    /** Consulta base de lotes con existencias. */
    private String sqlLotes() {
        return "SELECT m.codigo, m.nombre producto, l.numero_lote lote, l.fecha_vencimiento vence, "
                + "DATEDIFF(l.fecha_vencimiento, CURDATE()) dias, l.cantidad_disponible disponible, "
                + "l.cantidad_disponible * COALESCE(l.precio_compra, 0) costo "
                + "FROM lote_medicamento l JOIN medicamento m ON m.id = l.medicamento_id WHERE l.cantidad_disponible > 0 ";
    }

    /** Columnas de los reportes de lotes. */
    private List<Columna> columnasLotes() {
        return List.of(col("codigo", "Código", "TEXTO"), col("producto", "Producto", "TEXTO"), col("lote", "Lote", "TEXTO"),
                col("vence", "Vence", "FECHA"), col("dias", "Días", "ENTERO"), col("disponible", "Unidades", "ENTERO"),
                col("costo", "Valor a costo", "MONEDA"));
    }

    /** Parámetros del rango de fechas (hasta incluido). */
    private MapSqlParameterSource rango(ReporteFiltroRq f) {
        return new MapSqlParameterSource().addValue("desde", f.getDesde().atStartOfDay())
                .addValue("hasta", f.getHasta().plusDays(1).atStartOfDay());
    }

    /** Formato SQL del período según la agrupación. */
    private String formatoPeriodo(ReporteFiltroRq f, ReporteRs r) {
        String a = f.getAgrupacion() == null ? "DIA" : f.getAgrupacion().trim().toUpperCase();
        String formato = switch (a) {
            case "DIA" -> "%Y-%m-%d";
            case "MES" -> "%Y-%m";
            case "ANIO" -> "%Y";
            default -> throw new BadRequestException("La agrupación debe ser DIA, MES o ANIO");
        };
        this.agregarFiltro(r, "Agrupado por " + ("DIA".equals(a) ? "día" : "MES".equals(a) ? "mes" : "año"));
        return formato;
    }

    /** Condición por veterinario. */
    private String filtroMedico(ReporteFiltroRq f, MapSqlParameterSource p, ReporteRs r, String columna) {
        if (f.getMedicoId() == null) {
            return "";
        }
        p.addValue("medicoId", f.getMedicoId());
        this.agregarFiltro(r, "Veterinario: " + this.nombre("SELECT CONCAT(nombres, ' ', apellidos) FROM medico WHERE id = ?",
                f.getMedicoId()));
        return " AND " + columna + " = :medicoId ";
    }

    /** Condición por medicamento. */
    private String filtroMedicamento(ReporteFiltroRq f, MapSqlParameterSource p, ReporteRs r, String columna) {
        if (f.getMedicamentoId() == null) {
            return "";
        }
        p.addValue("medicamentoId", f.getMedicamentoId());
        this.agregarFiltro(r, "Producto: " + this.nombre("SELECT CONCAT(codigo, ' ', nombre) FROM medicamento WHERE id = ?",
                f.getMedicamentoId()));
        return " AND " + columna + " = :medicamentoId ";
    }

    /** Nombre de un registro para el encabezado (404 si no existe). */
    private String nombre(String sql, Long id) {
        List<String> r = jdbc.getJdbcTemplate().queryForList(sql, String.class, id);
        if (r.isEmpty()) {
            throw new NotFoundException("El filtro seleccionado no existe");
        }
        return r.get(0);
    }

    private void agregarFiltro(ReporteRs r, String texto) {
        r.setFiltrosAplicados(r.getFiltrosAplicados() == null || r.getFiltrosAplicados().isBlank()
                ? texto : r.getFiltrosAplicados() + " · " + texto);
    }

    /** Ejecuta la consulta y llena columnas, filas y totales. */
    private ReporteRs llenar(ReporteRs r, String sql, MapSqlParameterSource p, List<Columna> columnas, String... sumar) {
        r.setColumnas(columnas);
        List<Map<String, Object>> filas = new ArrayList<>();
        for (Map<String, Object> fila : jdbc.queryForList(sql, p)) {
            Map<String, Object> limpia = new LinkedHashMap<>();
            fila.forEach((k, v) -> limpia.put(k.toLowerCase(), this.normalizar(v)));
            filas.add(limpia);
        }
        r.setFilas(filas);
        this.totalizar(r, sumar);
        return r;
    }

    /** Suma columnas numéricas. */
    private void totalizar(ReporteRs r, String... claves) {
        for (String c : claves) {
            r.getTotales().put(c, this.sumar(r.getFilas(), c));
        }
    }

    private BigDecimal sumar(List<Map<String, Object>> filas, String clave) {
        return filas.stream().map(f -> f.get(clave)).filter(v -> v instanceof Number)
                .map(v -> v instanceof BigDecimal b ? b : new BigDecimal(v.toString()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Convierte fechas SQL a tipos de Java Time para el JSON. */
    private Object normalizar(Object v) {
        if (v instanceof java.sql.Timestamp t) {
            return t.toLocalDateTime();
        }
        if (v instanceof java.sql.Date d) {
            return d.toLocalDate();
        }
        if (v instanceof Boolean b) {
            return b ? 1 : 0;
        }
        return v;
    }
}
