package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.ReporteCatalogoRs;
import com.uniminuto.clinica.models.ReporteData;
import com.uniminuto.clinica.models.ReporteFiltro;
import com.uniminuto.clinica.security.ContextoUsuario;
import com.uniminuto.clinica.service.ReporteService;
import com.uniminuto.clinica.utils.Formato;
import com.uniminuto.clinica.utils.Validar;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * Reportes administrativos, contables, de inventario y de gestión médica.
 * Todos se calculan directamente sobre facturas, pagos, movimientos y citas
 * registrados (coherencia con la operación). Las facturas ANULADAS y los pagos
 * anulados no suman ingresos.
 */
@Service
public class ReporteServiceImpl implements ReporteService {

    private static final List<String> F_FECHAS = List.of("fechaInicial", "fechaFinal");

    @Autowired
    private DataSource dataSource;

    private NamedParameterJdbcTemplate jdbc;

    @PostConstruct
    void iniciar() {
        jdbc = new NamedParameterJdbcTemplate(dataSource);
    }

    @Override
    public List<ReporteCatalogoRs> catalogo() {
        List<ReporteCatalogoRs> c = new ArrayList<>();
        String fin = "Financieros";
        c.add(new ReporteCatalogoRs("ingresos-periodo", "Ingresos por periodo (día / mes / año)", fin, lista("agrupacion")));
        c.add(new ReporteCatalogoRs("ingresos-servicios", "Ingresos por consultas y servicios", fin, lista("tipo")));
        c.add(new ReporteCatalogoRs("ingresos-especialidad", "Ingresos por especialidad", fin, F_FECHAS));
        c.add(new ReporteCatalogoRs("ingresos-veterinario", "Ingresos por veterinario", fin, F_FECHAS));
        c.add(new ReporteCatalogoRs("ingresos-medicamentos", "Ingresos por venta de medicamentos", fin, F_FECHAS));
        c.add(new ReporteCatalogoRs("facturas", "Facturas generadas (pagadas, pendientes, parciales, anuladas)", fin, lista("estado")));
        c.add(new ReporteCatalogoRs("pagos", "Pagos recibidos (recaudo)", fin, F_FECHAS));
        c.add(new ReporteCatalogoRs("impuestos", "Impuestos registrados", fin, F_FECHAS));
        c.add(new ReporteCatalogoRs("descuentos", "Descuentos aplicados", fin, F_FECHAS));
        String inv = "Inventario";
        c.add(new ReporteCatalogoRs("existencias", "Existencias y valorización (costo y venta)", inv, List.of()));
        c.add(new ReporteCatalogoRs("agotados", "Medicamentos agotados", inv, List.of()));
        c.add(new ReporteCatalogoRs("stock-minimo", "Medicamentos en stock mínimo", inv, List.of()));
        c.add(new ReporteCatalogoRs("proximos-vencer", "Lotes próximos a vencer", inv, List.of("dias")));
        c.add(new ReporteCatalogoRs("vencidos", "Lotes vencidos con existencia", inv, List.of()));
        c.add(new ReporteCatalogoRs("movimientos", "Entradas y salidas / historial por medicamento", inv,
                lista("medicamentoId", "tipo")));
        String med = "Gestión médica";
        c.add(new ReporteCatalogoRs("citas-periodo", "Número de citas por periodo y estado", med, lista("agrupacion", "medicoId")));
        c.add(new ReporteCatalogoRs("citas-detalle", "Citas atendidas, canceladas o pendientes", med, lista("estado", "medicoId")));
        c.add(new ReporteCatalogoRs("consultas-veterinario", "Consultas realizadas por veterinario", med, F_FECHAS));
        c.add(new ReporteCatalogoRs("consultas-especialidad", "Consultas realizadas por especialidad", med, F_FECHAS));
        c.add(new ReporteCatalogoRs("mascotas-atendidas", "Mascotas atendidas por periodo", med, F_FECHAS));
        return c;
    }

    private static List<String> lista(String... extra) {
        List<String> l = new ArrayList<>(F_FECHAS);
        l.addAll(List.of(extra));
        return l;
    }

    @Override
    @Transactional(readOnly = true)
    public ReporteData generar(String codigo, ReporteFiltro filtro) {
        ReporteFiltro f = filtro == null ? new ReporteFiltro() : filtro;
        LocalDate ini = f.getFechaInicial() == null ? LocalDate.now().withDayOfMonth(1) : f.getFechaInicial();
        LocalDate fin = f.getFechaFinal() == null ? LocalDate.now() : f.getFechaFinal();
        if (ini.isAfter(fin)) {
            throw new BadRequestException("La fecha inicial no puede ser mayor a la fecha final.");
        }
        Map<String, Object> p = new HashMap<>();
        p.put("ini", ini.atStartOfDay());
        p.put("fin", fin.plusDays(1).atStartOfDay());
        p.put("hoy", LocalDate.now());
        String periodo = "Periodo: " + Formato.fecha(ini) + " a " + Formato.fecha(fin);
        ReporteData r = switch (codigo == null ? "" : codigo) {
            case "ingresos-periodo" -> ingresosPeriodo(p, f);
            case "ingresos-servicios" -> ingresosServicios(p, f);
            case "ingresos-especialidad" -> ingresosEspecialidad(p);
            case "ingresos-veterinario" -> ingresosVeterinario(p);
            case "ingresos-medicamentos" -> ingresosMedicamentos(p);
            case "facturas" -> facturas(p, f);
            case "pagos" -> pagos(p);
            case "impuestos" -> impuestos(p);
            case "descuentos" -> descuentos(p);
            case "existencias" -> existencias(p, null);
            case "agotados" -> existencias(p, "AGOTADO");
            case "stock-minimo" -> existencias(p, "BAJO_STOCK");
            case "proximos-vencer" -> lotesVencimiento(p, f, false);
            case "vencidos" -> lotesVencimiento(p, f, true);
            case "movimientos" -> movimientos(p, f);
            case "citas-periodo" -> citasPeriodo(p, f);
            case "citas-detalle" -> citasDetalle(p, f);
            case "consultas-veterinario" -> consultasPor(p, "veterinario");
            case "consultas-especialidad" -> consultasPor(p, "especialidad");
            case "mascotas-atendidas" -> mascotasAtendidas(p);
            default -> throw new NotFoundException("El reporte '" + codigo + "' no existe.");
        };
        r.setCodigo(codigo);
        if (r.getSubtitulo() == null) {
            boolean sinFechas = Set.of("existencias", "agotados", "stock-minimo", "proximos-vencer", "vencidos").contains(codigo);
            r.setSubtitulo(sinFechas ? "Corte al " + Formato.fecha(LocalDate.now()) : periodo);
        } else if (!r.getSubtitulo().startsWith("Corte")) {
            r.setSubtitulo(periodo + "  |  " + r.getSubtitulo());
        }
        r.setGeneradoPor(ContextoUsuario.obtener().nombreCompleto());
        return r;
    }

    // ================================================================== financieros

    private ReporteData ingresosPeriodo(Map<String, Object> p, ReporteFiltro f) {
        String agr = Validar.vacio(f.getAgrupacion()) ? "DIA" : Validar.enLista(f.getAgrupacion(), List.of("DIA", "MES", "ANIO"), "agrupación");
        String fmt = switch (agr) {
            case "MES" -> "%Y-%m";
            case "ANIO" -> "%Y";
            default -> "%Y-%m-%d";
        };
        p.put("fmt", fmt);
        List<Map<String, Object>> fact = jdbc.queryForList("""
                SELECT DATE_FORMAT(f.fecha_generacion, :fmt) AS periodo, COUNT(*) AS facturas,
                       SUM(f.subtotal) AS subtotal, SUM(f.total_descuento) AS descuento,
                       SUM(f.total_impuestos) AS impuestos, SUM(f.total) AS total
                FROM factura f
                WHERE f.estado <> 'ANULADA' AND f.fecha_generacion >= :ini AND f.fecha_generacion < :fin
                GROUP BY periodo
                """, p);
        List<Map<String, Object>> rec = jdbc.queryForList("""
                SELECT DATE_FORMAT(pg.fecha_pago, :fmt) AS periodo, SUM(pg.valor) AS recaudado
                FROM pago pg INNER JOIN factura f ON f.id = pg.factura_id
                WHERE pg.anulado = 0 AND f.estado <> 'ANULADA' AND pg.fecha_pago >= :ini AND pg.fecha_pago < :fin
                GROUP BY periodo
                """, p);
        TreeMap<String, Object[]> filas = new TreeMap<>();
        for (Map<String, Object> m : fact) {
            filas.put(str(m.get("periodo")), new Object[]{num(m.get("facturas")), dec(m.get("subtotal")),
                    dec(m.get("descuento")), dec(m.get("impuestos")), dec(m.get("total")), BigDecimal.ZERO});
        }
        for (Map<String, Object> m : rec) {
            Object[] v = filas.computeIfAbsent(str(m.get("periodo")), k -> new Object[]{0L, BigDecimal.ZERO,
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
            v[5] = dec(m.get("recaudado"));
        }
        ReporteData r = new ReporteData();
        r.setTitulo("Ingresos por periodo");
        r.setSubtitulo("Agrupación: " + agr + ". Facturado = facturas no anuladas; recaudado = pagos aplicados");
        r.columna("Periodo", "TEXTO").columna("N° facturas", "ENTERO").columna("Subtotal", "MONEDA")
                .columna("Descuentos", "MONEDA").columna("Impuestos", "MONEDA").columna("Total facturado", "MONEDA")
                .columna("Recaudado", "MONEDA");
        filas.forEach((k, v) -> {
            List<Object> fila = new ArrayList<>();
            fila.add(k);
            fila.addAll(List.of(v));
            r.getFilas().add(fila);
        });
        r.setTotales(totales(r, "TOTAL", 1, 2, 3, 4, 5, 6));
        return r;
    }

    private ReporteData ingresosServicios(Map<String, Object> p, ReporteFiltro f) {
        String tipo = Validar.vacio(f.getTipo()) ? "" : f.getTipo().trim().toUpperCase();
        p.put("tipo", tipo);
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT t.tipo_servicio AS tipo, t.codigo AS codigo, fd.descripcion AS servicio,
                       SUM(fd.cantidad) AS cantidad, SUM(fd.subtotal) AS base, SUM(fd.valor_impuesto) AS impuestos,
                       SUM(fd.total) AS total
                FROM factura_detalle fd
                INNER JOIN factura f ON f.id = fd.factura_id
                INNER JOIN tarifa t ON t.id = fd.tarifa_id
                WHERE fd.tipo_item = 'SERVICIO' AND f.estado <> 'ANULADA'
                  AND f.fecha_generacion >= :ini AND f.fecha_generacion < :fin
                  AND (:tipo = '' OR t.tipo_servicio = :tipo)
                GROUP BY t.tipo_servicio, t.codigo, fd.descripcion
                ORDER BY total DESC
                """, p);
        ReporteData r = new ReporteData();
        r.setTitulo("Ingresos por consultas y servicios");
        if (!tipo.isEmpty()) {
            r.setSubtitulo("Tipo de servicio: " + tipo);
        }
        r.columna("Tipo", "TEXTO").columna("Código", "TEXTO").columna("Servicio", "TEXTO").columna("Cantidad", "ENTERO")
                .columna("Base (neto de descuento)", "MONEDA").columna("Impuestos", "MONEDA").columna("Total", "MONEDA");
        for (Map<String, Object> m : rows) {
            r.getFilas().add(fila(m.get("tipo"), m.get("codigo"), m.get("servicio"), num(m.get("cantidad")),
                    dec(m.get("base")), dec(m.get("impuestos")), dec(m.get("total"))));
        }
        r.setTotales(totales(r, "TOTAL", 3, 4, 5, 6));
        return r;
    }

    private ReporteData ingresosEspecialidad(Map<String, Object> p) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT f.especializacion AS especialidad, COUNT(DISTINCT f.id) AS facturas,
                       SUM(CASE WHEN fd.tipo_item = 'SERVICIO' THEN fd.total ELSE 0 END) AS servicios,
                       SUM(CASE WHEN fd.tipo_item = 'PRODUCTO' THEN fd.total ELSE 0 END) AS productos,
                       SUM(fd.total) AS total
                FROM factura f INNER JOIN factura_detalle fd ON fd.factura_id = f.id
                WHERE f.estado <> 'ANULADA' AND f.fecha_generacion >= :ini AND f.fecha_generacion < :fin
                GROUP BY f.especializacion ORDER BY total DESC
                """, p);
        ReporteData r = new ReporteData();
        r.setTitulo("Ingresos por especialidad");
        r.columna("Especialidad", "TEXTO").columna("N° facturas", "ENTERO").columna("Servicios", "MONEDA")
                .columna("Medicamentos", "MONEDA").columna("Total", "MONEDA");
        for (Map<String, Object> m : rows) {
            r.getFilas().add(fila(m.get("especialidad"), num(m.get("facturas")), dec(m.get("servicios")),
                    dec(m.get("productos")), dec(m.get("total"))));
        }
        r.setTotales(totales(r, "TOTAL", 1, 2, 3, 4));
        return r;
    }

    private ReporteData ingresosVeterinario(Map<String, Object> p) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT CONCAT(m.nombres, ' ', m.apellidos) AS veterinario, e.nombre AS especialidad,
                       COUNT(DISTINCT f.id) AS facturas,
                       SUM(CASE WHEN fd.tipo_item = 'SERVICIO' THEN fd.total ELSE 0 END) AS servicios,
                       SUM(CASE WHEN fd.tipo_item = 'PRODUCTO' THEN fd.total ELSE 0 END) AS productos,
                       SUM(fd.total) AS total
                FROM factura f
                INNER JOIN factura_detalle fd ON fd.factura_id = f.id
                INNER JOIN medico m ON m.id = f.medico_id
                INNER JOIN especializacion e ON e.id = m.especializacion_id
                WHERE f.estado <> 'ANULADA' AND f.fecha_generacion >= :ini AND f.fecha_generacion < :fin
                GROUP BY m.id, m.nombres, m.apellidos, e.nombre ORDER BY total DESC
                """, p);
        ReporteData r = new ReporteData();
        r.setTitulo("Ingresos por veterinario");
        r.columna("Veterinario", "TEXTO").columna("Especialidad", "TEXTO").columna("N° facturas", "ENTERO")
                .columna("Servicios", "MONEDA").columna("Medicamentos", "MONEDA").columna("Total", "MONEDA");
        for (Map<String, Object> m : rows) {
            r.getFilas().add(fila(m.get("veterinario"), m.get("especialidad"), num(m.get("facturas")),
                    dec(m.get("servicios")), dec(m.get("productos")), dec(m.get("total"))));
        }
        r.setTotales(totales(r, "TOTAL", 2, 3, 4, 5));
        return r;
    }

    private ReporteData ingresosMedicamentos(Map<String, Object> p) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT md.codigo AS codigo, md.nombre AS producto, SUM(fd.cantidad) AS cantidad,
                       SUM(fd.subtotal) AS base, SUM(fd.valor_impuesto) AS impuestos, SUM(fd.total) AS total,
                       SUM(fd.cantidad * l.precio_compra) AS costo
                FROM factura_detalle fd
                INNER JOIN factura f ON f.id = fd.factura_id
                INNER JOIN medicamento md ON md.id = fd.medicamento_id
                INNER JOIN despacho_detalle dd ON dd.id = fd.despacho_detalle_id
                INNER JOIN lote_medicamento l ON l.id = dd.lote_id
                WHERE fd.tipo_item = 'PRODUCTO' AND f.estado <> 'ANULADA'
                  AND f.fecha_generacion >= :ini AND f.fecha_generacion < :fin
                GROUP BY md.id, md.codigo, md.nombre ORDER BY total DESC
                """, p);
        ReporteData r = new ReporteData();
        r.setTitulo("Ingresos por venta de medicamentos");
        r.columna("Código", "TEXTO").columna("Producto", "TEXTO").columna("Cantidad", "ENTERO")
                .columna("Base", "MONEDA").columna("Impuestos", "MONEDA").columna("Total", "MONEDA")
                .columna("Costo", "MONEDA").columna("Margen (base - costo)", "MONEDA");
        for (Map<String, Object> m : rows) {
            BigDecimal base = dec(m.get("base"));
            BigDecimal costo = dec(m.get("costo"));
            r.getFilas().add(fila(m.get("codigo"), m.get("producto"), num(m.get("cantidad")), base,
                    dec(m.get("impuestos")), dec(m.get("total")), costo, base.subtract(costo)));
        }
        r.setTotales(totales(r, "TOTAL", 2, 3, 4, 5, 6, 7));
        return r;
    }

    private ReporteData facturas(Map<String, Object> p, ReporteFiltro f) {
        String estado = Validar.vacio(f.getEstado()) || "TODAS".equalsIgnoreCase(f.getEstado()) ? ""
                : Validar.enLista(f.getEstado(), List.of("PENDIENTE", "PAGO_PARCIAL", "PAGADA", "ANULADA"), "estado");
        p.put("estado", estado);
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT f.numero AS numero, f.fecha_generacion AS fecha, CONCAT(c.nombres, ' ', c.apellidos) AS propietario,
                       ma.nombre_mascota AS mascota, CONCAT(m.nombres, ' ', m.apellidos) AS veterinario, f.estado AS estado,
                       f.total AS total, f.total_pagado AS pagado, f.saldo AS saldo
                FROM factura f
                INNER JOIN cliente c ON c.cliente_id = f.cliente_id
                INNER JOIN mascota ma ON ma.mascota_id = f.mascota_id
                INNER JOIN medico m ON m.id = f.medico_id
                WHERE f.fecha_generacion >= :ini AND f.fecha_generacion < :fin AND (:estado = '' OR f.estado = :estado)
                ORDER BY f.fecha_generacion
                """, p);
        ReporteData r = new ReporteData();
        r.setTitulo("Facturas generadas");
        r.columna("Número", "TEXTO").columna("Fecha", "FECHA_HORA").columna("Propietario", "TEXTO")
                .columna("Mascota", "TEXTO").columna("Veterinario", "TEXTO").columna("Estado", "TEXTO")
                .columna("Total", "MONEDA").columna("Pagado", "MONEDA").columna("Saldo", "MONEDA");
        Map<String, Long> conteo = new LinkedHashMap<>();
        for (Map<String, Object> m : rows) {
            r.getFilas().add(fila(m.get("numero"), fecha(m.get("fecha")), m.get("propietario"), m.get("mascota"),
                    m.get("veterinario"), m.get("estado"), dec(m.get("total")), dec(m.get("pagado")), dec(m.get("saldo"))));
            conteo.merge(str(m.get("estado")), 1L, Long::sum);
        }
        StringBuilder sb = new StringBuilder(estado.isEmpty() ? "Todos los estados" : "Estado: " + estado);
        sb.append(". Conteo: ");
        conteo.forEach((k, v) -> sb.append(k).append("=").append(v).append(" "));
        r.setSubtitulo(sb.toString().trim());
        r.setTotales(totales(r, "TOTAL (" + rows.size() + ")", 6, 7, 8));
        return r;
    }

    private ReporteData pagos(Map<String, Object> p) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT pg.fecha_pago AS fecha, f.numero AS factura, CONCAT(c.nombres, ' ', c.apellidos) AS propietario,
                       pg.metodo_pago AS metodo, pg.referencia AS referencia, pg.valor AS valor,
                       CASE WHEN pg.anulado = 1 THEN 'ANULADO' ELSE 'APLICADO' END AS estado, u.nombre_completo AS usuario
                FROM pago pg
                INNER JOIN factura f ON f.id = pg.factura_id
                INNER JOIN cliente c ON c.cliente_id = f.cliente_id
                INNER JOIN usuario u ON u.usuario_id = pg.usuario_id
                WHERE pg.fecha_pago >= :ini AND pg.fecha_pago < :fin
                ORDER BY pg.fecha_pago
                """, p);
        ReporteData r = new ReporteData();
        r.setTitulo("Pagos recibidos");
        r.columna("Fecha", "FECHA_HORA").columna("Factura", "TEXTO").columna("Propietario", "TEXTO")
                .columna("Método", "TEXTO").columna("Referencia", "TEXTO").columna("Valor", "MONEDA")
                .columna("Estado", "TEXTO").columna("Registró", "TEXTO");
        BigDecimal aplicado = BigDecimal.ZERO;
        for (Map<String, Object> m : rows) {
            r.getFilas().add(fila(fecha(m.get("fecha")), m.get("factura"), m.get("propietario"), m.get("metodo"),
                    m.get("referencia"), dec(m.get("valor")), m.get("estado"), m.get("usuario")));
            if ("APLICADO".equals(m.get("estado"))) {
                aplicado = aplicado.add(dec(m.get("valor")));
            }
        }
        r.setTotales(fila("TOTAL APLICADO", null, null, null, null, aplicado, null, null));
        return r;
    }

    private ReporteData impuestos(Map<String, Object> p) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT fd.impuesto_codigo AS codigo, fd.impuesto_porcentaje AS porcentaje,
                       SUM(fd.subtotal) AS base, SUM(fd.valor_impuesto) AS valor, COUNT(*) AS lineas
                FROM factura_detalle fd INNER JOIN factura f ON f.id = fd.factura_id
                WHERE f.estado <> 'ANULADA' AND f.fecha_generacion >= :ini AND f.fecha_generacion < :fin
                GROUP BY fd.impuesto_codigo, fd.impuesto_porcentaje ORDER BY fd.impuesto_codigo
                """, p);
        ReporteData r = new ReporteData();
        r.setTitulo("Impuestos registrados en facturación");
        r.columna("Impuesto", "TEXTO").columna("Porcentaje", "DECIMAL").columna("Líneas", "ENTERO")
                .columna("Base gravable", "MONEDA").columna("Valor impuesto", "MONEDA");
        for (Map<String, Object> m : rows) {
            r.getFilas().add(fila(m.get("codigo"), dec(m.get("porcentaje")), num(m.get("lineas")), dec(m.get("base")),
                    dec(m.get("valor"))));
        }
        r.setTotales(totales(r, "TOTAL", 2, 3, 4));
        return r;
    }

    private ReporteData descuentos(Map<String, Object> p) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT f.numero AS numero, f.fecha_generacion AS fecha, CONCAT(c.nombres, ' ', c.apellidos) AS propietario,
                       u.nombre_completo AS autoriza, f.subtotal AS subtotal, f.total_descuento AS descuento, f.total AS total
                FROM factura f
                INNER JOIN cliente c ON c.cliente_id = f.cliente_id
                LEFT JOIN usuario u ON u.usuario_id = f.usuario_autoriza_dcto
                WHERE f.estado <> 'ANULADA' AND f.total_descuento > 0
                  AND f.fecha_generacion >= :ini AND f.fecha_generacion < :fin
                ORDER BY f.fecha_generacion
                """, p);
        ReporteData r = new ReporteData();
        r.setTitulo("Descuentos aplicados");
        r.columna("Factura", "TEXTO").columna("Fecha", "FECHA_HORA").columna("Propietario", "TEXTO")
                .columna("Autorizado por", "TEXTO").columna("Subtotal", "MONEDA").columna("Descuento", "MONEDA")
                .columna("Total", "MONEDA");
        for (Map<String, Object> m : rows) {
            r.getFilas().add(fila(m.get("numero"), fecha(m.get("fecha")), m.get("propietario"), m.get("autoriza"),
                    dec(m.get("subtotal")), dec(m.get("descuento")), dec(m.get("total"))));
        }
        r.setTotales(totales(r, "TOTAL", 4, 5, 6));
        return r;
    }

    // ================================================================== inventario

    private ReporteData existencias(Map<String, Object> p, String soloEstado) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT m.codigo AS codigo, m.nombre AS producto, m.tipo_producto AS tipo, m.unidad_medida AS unidad,
                       m.stock_minimo AS minimo, m.precio_venta AS precio_venta,
                       COALESCE(SUM(l.cantidad_disponible), 0) AS total,
                       COALESCE(SUM(CASE WHEN l.fecha_vencimiento IS NULL OR l.fecha_vencimiento > :hoy
                                         THEN l.cantidad_disponible ELSE 0 END), 0) AS vigente,
                       COALESCE(SUM(l.cantidad_disponible * l.precio_compra), 0) AS valor_costo
                FROM medicamento m
                LEFT JOIN lote_medicamento l ON l.medicamento_id = m.id AND l.activo = 1 AND l.cantidad_disponible > 0
                WHERE m.activo = 1
                GROUP BY m.id, m.codigo, m.nombre, m.tipo_producto, m.unidad_medida, m.stock_minimo, m.precio_venta
                ORDER BY m.nombre
                """, p);
        ReporteData r = new ReporteData();
        r.setTitulo(soloEstado == null ? "Existencias y valorización del inventario"
                : ("AGOTADO".equals(soloEstado) ? "Medicamentos agotados" : "Medicamentos en stock mínimo"));
        r.columna("Código", "TEXTO").columna("Producto", "TEXTO").columna("Tipo", "TEXTO").columna("Unidad", "TEXTO")
                .columna("Existencia total", "ENTERO").columna("Vigente", "ENTERO").columna("Vencida", "ENTERO")
                .columna("Stock mínimo", "ENTERO").columna("Estado", "TEXTO")
                .columna("Valor a costo", "MONEDA").columna("Valor potencial de venta", "MONEDA");
        for (Map<String, Object> m : rows) {
            long total = num(m.get("total"));
            long vigente = num(m.get("vigente"));
            long minimo = num(m.get("minimo"));
            String estado = vigente == 0 ? "AGOTADO" : (vigente <= minimo ? "BAJO_STOCK" : "NORMAL");
            if (soloEstado != null && !soloEstado.equals(estado)) {
                continue;
            }
            BigDecimal venta = dec(m.get("precio_venta")).multiply(BigDecimal.valueOf(vigente));
            r.getFilas().add(fila(m.get("codigo"), m.get("producto"), m.get("tipo"), m.get("unidad"), total, vigente,
                    total - vigente, minimo, estado, dec(m.get("valor_costo")), venta));
        }
        r.setTotales(totales(r, "TOTAL (" + r.getFilas().size() + " productos)", 4, 5, 6, 9, 10));
        return r;
    }

    private ReporteData lotesVencimiento(Map<String, Object> p, ReporteFiltro f, boolean vencidos) {
        int dias = f.getDias() == null ? 30 : Validar.entero(f.getDias(), "días", 1, 365);
        p.put("limite", LocalDate.now().plusDays(dias));
        String condicion = vencidos ? "l.fecha_vencimiento <= :hoy"
                : "l.fecha_vencimiento > :hoy AND l.fecha_vencimiento <= :limite";
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT m.codigo AS codigo, m.nombre AS producto, l.numero_lote AS lote, l.fecha_vencimiento AS vence,
                       DATEDIFF(l.fecha_vencimiento, :hoy) AS dias, l.cantidad_disponible AS disponible,
                       l.cantidad_disponible * l.precio_compra AS valor
                FROM lote_medicamento l INNER JOIN medicamento m ON m.id = l.medicamento_id
                WHERE l.activo = 1 AND l.cantidad_disponible > 0 AND l.fecha_vencimiento IS NOT NULL AND
                """ + condicion + " ORDER BY l.fecha_vencimiento", p);
        ReporteData r = new ReporteData();
        r.setTitulo(vencidos ? "Lotes vencidos con existencia (no dispensables)" : "Lotes próximos a vencer");
        r.setSubtitulo("Corte al " + Formato.fecha(LocalDate.now()) + (vencidos ? "" : " - ventana de " + dias + " días"));
        r.columna("Código", "TEXTO").columna("Producto", "TEXTO").columna("Lote", "TEXTO").columna("Vence", "FECHA")
                .columna(vencidos ? "Días vencido" : "Días para vencer", "ENTERO").columna("Disponible", "ENTERO")
                .columna("Valor a costo", "MONEDA");
        for (Map<String, Object> m : rows) {
            long d = num(m.get("dias"));
            r.getFilas().add(fila(m.get("codigo"), m.get("producto"), m.get("lote"), fechaSolo(m.get("vence")),
                    vencidos ? Math.abs(d) : d, num(m.get("disponible")), dec(m.get("valor"))));
        }
        r.setTotales(totales(r, "TOTAL", 5, 6));
        return r;
    }

    private ReporteData movimientos(Map<String, Object> p, ReporteFiltro f) {
        String tipo = Validar.vacio(f.getTipo()) ? "" : Validar.enLista(f.getTipo(), List.of("ENTRADA", "SALIDA"), "tipo");
        p.put("tipo", tipo);
        p.put("med", f.getMedicamentoId() == null ? -1L : f.getMedicamentoId());
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT mv.fecha AS fecha, mv.tipo AS tipo, mv.concepto AS concepto, m.codigo AS codigo, m.nombre AS producto,
                       l.numero_lote AS lote, mv.cantidad AS cantidad, mv.saldo_anterior AS saldo_anterior,
                       mv.saldo_nuevo AS saldo_nuevo, mv.costo_unitario AS costo,
                       CONCAT_WS(' ', fm.numero, d.numero, CASE WHEN mv.carga_id IS NULL THEN NULL ELSE CONCAT('Carga #', mv.carga_id) END) AS referencia,
                       u.nombre_completo AS usuario
                FROM movimiento_inventario mv
                INNER JOIN medicamento m ON m.id = mv.medicamento_id
                LEFT JOIN lote_medicamento l ON l.id = mv.lote_id
                LEFT JOIN formula_medica fm ON fm.id = mv.formula_id
                LEFT JOIN despacho d ON d.id = mv.despacho_id
                INNER JOIN usuario u ON u.usuario_id = mv.usuario_id
                WHERE mv.fecha >= :ini AND mv.fecha < :fin AND (:tipo = '' OR mv.tipo = :tipo)
                  AND (:med = -1 OR mv.medicamento_id = :med)
                ORDER BY mv.fecha, mv.id
                """, p);
        ReporteData r = new ReporteData();
        r.setTitulo(f.getMedicamentoId() == null ? "Entradas y salidas de inventario" : "Historial de movimientos del medicamento");
        r.columna("Fecha", "FECHA_HORA").columna("Tipo", "TEXTO").columna("Concepto", "TEXTO").columna("Código", "TEXTO")
                .columna("Producto", "TEXTO").columna("Lote", "TEXTO").columna("Cantidad", "ENTERO")
                .columna("Saldo anterior", "ENTERO").columna("Saldo nuevo", "ENTERO").columna("Costo unit.", "MONEDA")
                .columna("Referencia", "TEXTO").columna("Usuario", "TEXTO");
        long entradas = 0;
        long salidas = 0;
        for (Map<String, Object> m : rows) {
            long cant = num(m.get("cantidad"));
            if ("ENTRADA".equals(m.get("tipo"))) {
                entradas += cant;
            } else {
                salidas += cant;
            }
            r.getFilas().add(fila(fecha(m.get("fecha")), m.get("tipo"), m.get("concepto"), m.get("codigo"),
                    m.get("producto"), m.get("lote"), cant, num(m.get("saldo_anterior")), num(m.get("saldo_nuevo")),
                    dec(m.get("costo")), m.get("referencia"), m.get("usuario")));
        }
        r.setSubtitulo((tipo.isEmpty() ? "Entradas y salidas" : tipo) + ". Unidades: entradas " + entradas + ", salidas " + salidas);
        r.setTotales(fila("Entradas: " + entradas, "Salidas: " + salidas, null, null, null, null, null, null, null, null, null, null));
        return r;
    }

    // ================================================================== gestión médica

    private ReporteData citasPeriodo(Map<String, Object> p, ReporteFiltro f) {
        String agr = Validar.vacio(f.getAgrupacion()) ? "DIA" : Validar.enLista(f.getAgrupacion(), List.of("DIA", "MES", "ANIO"), "agrupación");
        p.put("fmt", switch (agr) {
            case "MES" -> "%Y-%m";
            case "ANIO" -> "%Y";
            default -> "%Y-%m-%d";
        });
        p.put("medico", f.getMedicoId() == null ? -1L : f.getMedicoId());
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT DATE_FORMAT(c.fecha_hora, :fmt) AS periodo, COUNT(*) AS total,
                       SUM(c.estado IN ('PENDIENTE','PROGRAMADA')) AS pendientes,
                       SUM(c.estado = 'CONFIRMADA') AS confirmadas,
                       SUM(c.estado = 'EN_ATENCION') AS en_atencion,
                       SUM(c.estado = 'ATENDIDA') AS atendidas,
                       SUM(c.estado = 'CANCELADA') AS canceladas
                FROM cita c
                WHERE c.fecha_hora >= :ini AND c.fecha_hora < :fin AND (:medico = -1 OR c.medico_id = :medico)
                GROUP BY periodo ORDER BY periodo
                """, p);
        ReporteData r = new ReporteData();
        r.setTitulo("Número de citas por periodo");
        r.setSubtitulo("Agrupación: " + agr + (f.getMedicoId() == null ? "" : " - veterinario #" + f.getMedicoId()));
        r.columna("Periodo", "TEXTO").columna("Total", "ENTERO").columna("Pendientes", "ENTERO")
                .columna("Confirmadas", "ENTERO").columna("En atención", "ENTERO").columna("Atendidas", "ENTERO")
                .columna("Canceladas", "ENTERO");
        for (Map<String, Object> m : rows) {
            r.getFilas().add(fila(m.get("periodo"), num(m.get("total")), num(m.get("pendientes")), num(m.get("confirmadas")),
                    num(m.get("en_atencion")), num(m.get("atendidas")), num(m.get("canceladas"))));
        }
        r.setTotales(totales(r, "TOTAL", 1, 2, 3, 4, 5, 6));
        return r;
    }

    private ReporteData citasDetalle(Map<String, Object> p, ReporteFiltro f) {
        String estado = Validar.vacio(f.getEstado()) || "TODAS".equalsIgnoreCase(f.getEstado()) ? "" : f.getEstado().trim().toUpperCase();
        if (!estado.isEmpty() && !Set.of("ATENDIDA", "CANCELADA", "PENDIENTE", "CONFIRMADA", "PROGRAMADA", "EN_ATENCION").contains(estado)) {
            throw new BadRequestException("Estado de cita no válido: " + estado);
        }
        p.put("estado", estado);
        p.put("medico", f.getMedicoId() == null ? -1L : f.getMedicoId());
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT c.id AS id, c.fecha_hora AS fecha, c.estado AS estado, CONCAT(m.nombres, ' ', m.apellidos) AS veterinario,
                       CONCAT(cl.nombres, ' ', cl.apellidos) AS propietario, ma.nombre_mascota AS mascota,
                       c.motivo AS motivo, c.motivo_cancelacion AS cancelacion
                FROM cita c
                INNER JOIN medico m ON m.id = c.medico_id
                INNER JOIN cliente cl ON cl.cliente_id = c.cliente_id
                INNER JOIN mascota ma ON ma.mascota_id = c.mascota_id
                WHERE c.fecha_hora >= :ini AND c.fecha_hora < :fin AND (:medico = -1 OR c.medico_id = :medico)
                  AND (:estado = '' OR c.estado = :estado OR (:estado = 'PENDIENTE' AND c.estado = 'PROGRAMADA'))
                ORDER BY c.fecha_hora
                """, p);
        ReporteData r = new ReporteData();
        r.setTitulo("Detalle de citas" + (estado.isEmpty() ? "" : " - " + estado));
        r.columna("N°", "ENTERO").columna("Fecha", "FECHA_HORA").columna("Estado", "TEXTO").columna("Veterinario", "TEXTO")
                .columna("Propietario", "TEXTO").columna("Mascota", "TEXTO").columna("Motivo", "TEXTO")
                .columna("Motivo cancelación", "TEXTO");
        for (Map<String, Object> m : rows) {
            r.getFilas().add(fila(num(m.get("id")), fecha(m.get("fecha")), m.get("estado"), m.get("veterinario"),
                    m.get("propietario"), m.get("mascota"), m.get("motivo"), m.get("cancelacion")));
        }
        r.setTotales(fila("Total: " + rows.size(), null, null, null, null, null, null, null));
        return r;
    }

    private ReporteData consultasPor(Map<String, Object> p, String eje) {
        boolean porVet = "veterinario".equals(eje);
        String grupo = porVet ? "CONCAT(m.nombres, ' ', m.apellidos)" : "e.nombre";
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + grupo + " AS grupo, "
                + (porVet ? "e.nombre" : "COUNT(DISTINCT m.id)") + " AS extra, "
                + """
                       SUM(c.estado = 'ATENDIDA') AS atendidas, SUM(c.estado = 'CANCELADA') AS canceladas,
                       COUNT(*) AS total, COUNT(DISTINCT CASE WHEN c.estado = 'ATENDIDA' THEN c.mascota_id END) AS mascotas
                FROM cita c
                INNER JOIN medico m ON m.id = c.medico_id
                INNER JOIN especializacion e ON e.id = m.especializacion_id
                WHERE c.fecha_hora >= :ini AND c.fecha_hora < :fin
                GROUP BY grupo, extra ORDER BY atendidas DESC
                """.replace("GROUP BY grupo, extra", porVet ? "GROUP BY m.id, m.nombres, m.apellidos, e.nombre" : "GROUP BY e.id, e.nombre"), p);
        ReporteData r = new ReporteData();
        r.setTitulo(porVet ? "Consultas realizadas por veterinario" : "Consultas realizadas por especialidad");
        r.columna(porVet ? "Veterinario" : "Especialidad", "TEXTO").columna(porVet ? "Especialidad" : "N° veterinarios",
                porVet ? "TEXTO" : "ENTERO").columna("Atendidas", "ENTERO").columna("Canceladas", "ENTERO")
                .columna("Total citas", "ENTERO").columna("Mascotas atendidas", "ENTERO");
        for (Map<String, Object> m : rows) {
            r.getFilas().add(fila(m.get("grupo"), porVet ? m.get("extra") : num(m.get("extra")), num(m.get("atendidas")),
                    num(m.get("canceladas")), num(m.get("total")), num(m.get("mascotas"))));
        }
        r.setTotales(totales(r, "TOTAL", 2, 3, 4));
        return r;
    }

    private ReporteData mascotasAtendidas(Map<String, Object> p) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT ma.nombre_mascota AS mascota, CONCAT(rz.especie, ' / ', rz.nombre) AS raza,
                       CONCAT(cl.nombres, ' ', cl.apellidos) AS propietario, COUNT(*) AS consultas,
                       MAX(c.fecha_hora) AS ultima
                FROM cita c
                INNER JOIN mascota ma ON ma.mascota_id = c.mascota_id
                INNER JOIN raza rz ON rz.raza_id = ma.raza_id
                INNER JOIN cliente cl ON cl.cliente_id = c.cliente_id
                WHERE c.estado = 'ATENDIDA' AND c.fecha_hora >= :ini AND c.fecha_hora < :fin
                GROUP BY ma.mascota_id, ma.nombre_mascota, rz.especie, rz.nombre, cl.nombres, cl.apellidos
                ORDER BY consultas DESC, ma.nombre_mascota
                """, p);
        ReporteData r = new ReporteData();
        r.setTitulo("Mascotas atendidas");
        r.columna("Mascota", "TEXTO").columna("Especie / raza", "TEXTO").columna("Propietario", "TEXTO")
                .columna("Consultas", "ENTERO").columna("Última atención", "FECHA_HORA");
        for (Map<String, Object> m : rows) {
            r.getFilas().add(fila(m.get("mascota"), m.get("raza"), m.get("propietario"), num(m.get("consultas")),
                    fecha(m.get("ultima"))));
        }
        r.setTotales(fila("Mascotas: " + rows.size(), null, null, r.getFilas().stream()
                .mapToLong(x -> (Long) x.get(3)).sum(), null));
        return r;
    }

    // ================================================================== utilidades

    private static List<Object> fila(Object... valores) {
        List<Object> l = new ArrayList<>(valores.length);
        for (Object v : valores) {
            l.add(v);
        }
        return l;
    }

    /** Suma las columnas indicadas; la primera celda lleva la etiqueta. */
    private static List<Object> totales(ReporteData r, String etiqueta, int... columnas) {
        List<Object> t = new ArrayList<>();
        for (int i = 0; i < r.getColumnas().size(); i++) {
            t.add(null);
        }
        t.set(0, etiqueta);
        for (int c : columnas) {
            boolean moneda = "MONEDA".equals(r.getTipos().get(c)) || "DECIMAL".equals(r.getTipos().get(c));
            BigDecimal sumaD = BigDecimal.ZERO;
            long sumaL = 0;
            for (List<Object> f : r.getFilas()) {
                Object v = f.get(c);
                if (v instanceof BigDecimal bd) {
                    sumaD = sumaD.add(bd);
                } else if (v instanceof Number n) {
                    sumaL += n.longValue();
                }
            }
            t.set(c, moneda ? sumaD : (Object) sumaL);
        }
        return t;
    }

    private static BigDecimal dec(Object v) {
        if (v == null) {
            return BigDecimal.ZERO;
        }
        if (v instanceof BigDecimal bd) {
            return bd;
        }
        if (v instanceof Number n) {
            return new BigDecimal(n.toString());
        }
        return new BigDecimal(v.toString());
    }

    private static long num(Object v) {
        if (v == null) {
            return 0L;
        }
        if (v instanceof BigInteger bi) {
            return bi.longValue();
        }
        if (v instanceof Number n) {
            return n.longValue();
        }
        return Long.parseLong(v.toString());
    }

    private static String str(Object v) {
        return v == null ? "" : v.toString();
    }

    private static Object fecha(Object v) {
        if (v instanceof Timestamp ts) {
            return ts.toLocalDateTime();
        }
        return v;
    }

    private static Object fechaSolo(Object v) {
        if (v instanceof Date d) {
            return d.toLocalDate();
        }
        return v;
    }
}
