package com.uniminuto.clinica.serviceimpl;

import java.io.StringReader;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/**
 * Estructura del archivo de carga masiva y conversión de valores.
 */
final class CargaMasivaFormato {

    /** Encabezados obligatorios (en cualquier orden). */
    static final List<String> COLUMNAS = List.of("codigo", "nombre", "descripcion", "presentacion", "tipo_producto",
            "registro_invima", "unidad_medida", "precio_compra", "precio_venta", "impuesto", "stock_minimo",
            "numero_lote", "cantidad", "fecha_compra", "fecha_vencimiento", "fecha_proximo_pedido");

    static final String CLAVE_ACCION = "_accion";
    static final String SEPARADOR_ERRORES = " | ";

    private static final List<DateTimeFormatter> FORMATOS_FECHA = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("d/M/uuuu").withResolverStyle(ResolverStyle.STRICT),
            DateTimeFormatter.ofPattern("uuuu/M/d").withResolverStyle(ResolverStyle.STRICT),
            DateTimeFormatter.ofPattern("d-M-uuuu").withResolverStyle(ResolverStyle.STRICT));

    private CargaMasivaFormato() {
    }

    /** Número decimal aceptando formato 1500, 1500.50, 1.500,50 o $1,500. Null si no es válido. */
    static BigDecimal decimal(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        String s = valor.replace("$", "").replace(" ", "").trim();
        if (s.contains(",") && s.contains(".")) {
            // el último separador es el decimal: 1.500,50 o 1,500.50
            if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
                s = s.replace(".", "").replace(",", ".");
            } else {
                s = s.replace(",", "");
            }
        } else if (s.matches("^-?\\d{1,3}([.,]\\d{3})+$")) {
            // separador de miles: 1.500 / 1,500 / 1.250.000
            s = s.replace(".", "").replace(",", "");
        } else {
            s = s.replace(",", ".");
        }
        try {
            return new BigDecimal(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Entero; null si no es un entero válido. */
    static Integer entero(String valor) {
        BigDecimal d = decimal(valor);
        if (d == null) {
            return null;
        }
        try {
            return d.stripTrailingZeros().scale() <= 0 ? d.intValueExact() : null;
        } catch (ArithmeticException e) {
            return null;
        }
    }

    static LocalDate fecha(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        for (DateTimeFormatter f : FORMATOS_FECHA) {
            try {
                return LocalDate.parse(valor.trim(), f);
            } catch (DateTimeParseException ignored) {
                // se intenta el siguiente formato
            }
        }
        return null;
    }

    static String serializar(Map<String, String> valores) {
        Properties p = new Properties();
        valores.forEach((k, v) -> p.setProperty(k, v == null ? "" : v));
        StringWriter w = new StringWriter();
        try {
            p.store(w, null);
        } catch (java.io.IOException e) {
            throw new IllegalStateException(e);
        }
        return w.toString();
    }

    static Map<String, String> deserializar(String texto) {
        Properties p = new Properties();
        try {
            p.load(new StringReader(texto == null ? "" : texto));
        } catch (java.io.IOException e) {
            throw new IllegalStateException(e);
        }
        Map<String, String> m = new LinkedHashMap<>();
        for (String c : COLUMNAS) {
            m.put(c, p.getProperty(c, ""));
        }
        if (p.getProperty(CLAVE_ACCION) != null) {
            m.put(CLAVE_ACCION, p.getProperty(CLAVE_ACCION));
        }
        return m;
    }
}
