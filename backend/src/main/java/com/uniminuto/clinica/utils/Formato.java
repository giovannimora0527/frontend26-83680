package com.uniminuto.clinica.utils;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Formatos de presentación (es-CO) para PDF y Excel.
 */
public final class Formato {

    public static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    public static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Locale ES_CO = Locale.forLanguageTag("es-CO");

    private Formato() {
    }

    public static String moneda(BigDecimal valor) {
        DecimalFormat df = new DecimalFormat("$ #,##0.##", DecimalFormatSymbols.getInstance(ES_CO));
        return df.format(valor == null ? BigDecimal.ZERO : valor);
    }

    public static String numero(Number valor) {
        DecimalFormat df = new DecimalFormat("#,##0.##", DecimalFormatSymbols.getInstance(ES_CO));
        return valor == null ? "" : df.format(valor);
    }

    public static String fecha(LocalDate fecha) {
        return fecha == null ? "" : FECHA.format(fecha);
    }

    public static String fechaHora(LocalDateTime fecha) {
        return fecha == null ? "" : FECHA_HORA.format(fecha);
    }

    public static String texto(Object valor) {
        if (valor == null) {
            return "";
        }
        if (valor instanceof LocalDateTime ldt) {
            return fechaHora(ldt);
        }
        if (valor instanceof LocalDate ld) {
            return fecha(ld);
        }
        if (valor instanceof Boolean b) {
            return b ? "Sí" : "No";
        }
        return String.valueOf(valor);
    }
}
