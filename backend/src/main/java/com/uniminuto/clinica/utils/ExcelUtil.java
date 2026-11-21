package com.uniminuto.clinica.utils;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Construcción de libros .xlsx con Apache POI. No usa autoSizeColumn
 * (requiere fuentes del sistema que no existen en el contenedor).
 */
public final class ExcelUtil {

    private ExcelUtil() {
    }

    /** Estilos reutilizables de un libro. */
    public static final class Estilos {
        public final CellStyle titulo;
        public final CellStyle subtitulo;
        public final CellStyle encabezado;
        public final CellStyle texto;
        public final CellStyle entero;
        public final CellStyle moneda;
        public final CellStyle fecha;
        public final CellStyle fechaHora;
        public final CellStyle total;
        public final CellStyle totalMoneda;

        public Estilos(XSSFWorkbook wb) {
            short fmtMoneda = wb.createDataFormat().getFormat("$ #,##0.00");
            short fmtEntero = wb.createDataFormat().getFormat("#,##0");
            Font negrita = wb.createFont();
            negrita.setBold(true);
            Font blanca = wb.createFont();
            blanca.setBold(true);
            blanca.setColor(IndexedColors.WHITE.getIndex());
            Font grande = wb.createFont();
            grande.setBold(true);
            grande.setFontHeightInPoints((short) 14);

            titulo = wb.createCellStyle();
            titulo.setFont(grande);
            subtitulo = wb.createCellStyle();
            encabezado = wb.createCellStyle();
            encabezado.setFont(blanca);
            encabezado.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            encabezado.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            bordes(encabezado);
            texto = wb.createCellStyle();
            bordes(texto);
            entero = wb.createCellStyle();
            entero.setDataFormat(fmtEntero);
            bordes(entero);
            moneda = wb.createCellStyle();
            moneda.setDataFormat(fmtMoneda);
            bordes(moneda);
            fecha = wb.createCellStyle();
            fecha.setDataFormat(wb.createDataFormat().getFormat("dd/mm/yyyy"));
            bordes(fecha);
            fechaHora = wb.createCellStyle();
            fechaHora.setDataFormat(wb.createDataFormat().getFormat("dd/mm/yyyy hh:mm"));
            bordes(fechaHora);
            total = wb.createCellStyle();
            total.setFont(negrita);
            total.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            total.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            bordes(total);
            totalMoneda = wb.createCellStyle();
            totalMoneda.cloneStyleFrom(total);
            totalMoneda.setDataFormat(fmtMoneda);
        }

        private static void bordes(CellStyle s) {
            s.setBorderBottom(BorderStyle.THIN);
            s.setBorderTop(BorderStyle.THIN);
            s.setBorderLeft(BorderStyle.THIN);
            s.setBorderRight(BorderStyle.THIN);
        }
    }

    /** Escribe un valor según su tipo Java ("MONEDA" fuerza formato de moneda). */
    public static void celda(Row fila, int col, Object valor, String tipo, Estilos e, boolean esTotal) {
        Cell c = fila.createCell(col);
        if (valor == null) {
            c.setCellStyle(esTotal ? e.total : e.texto);
            return;
        }
        if (valor instanceof Number n) {
            c.setCellValue(n instanceof BigDecimal bd ? bd.doubleValue() : n.doubleValue());
            boolean moneda = "MONEDA".equals(tipo);
            c.setCellStyle(esTotal ? (moneda ? e.totalMoneda : e.total) : (moneda ? e.moneda : e.entero));
            if (!moneda && !(n instanceof Integer || n instanceof Long) && !esTotal) {
                c.setCellStyle(e.texto);
            }
        } else if (valor instanceof LocalDateTime ldt) {
            c.setCellValue(java.util.Date.from(ldt.atZone(java.time.ZoneId.systemDefault()).toInstant()));
            c.setCellStyle(e.fechaHora);
        } else if (valor instanceof LocalDate ld) {
            c.setCellValue(java.util.Date.from(ld.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()));
            c.setCellStyle(e.fecha);
        } else {
            c.setCellValue(Formato.texto(valor));
            c.setCellStyle(esTotal ? e.total : e.texto);
        }
    }

    public static void anchos(Sheet hoja, List<String> columnas, List<List<Object>> filas) {
        for (int i = 0; i < columnas.size(); i++) {
            int max = columnas.get(i).length();
            for (List<Object> f : filas) {
                if (i < f.size() && f.get(i) != null) {
                    max = Math.max(max, Formato.texto(f.get(i)).length());
                }
            }
            hoja.setColumnWidth(i, Math.min(60, Math.max(10, max + 3)) * 256);
        }
    }

    public static byte[] bytes(XSSFWorkbook wb) {
        try (wb; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            wb.write(out);
            return out.toByteArray();
        } catch (Exception ex) {
            throw new IllegalStateException("No fue posible generar el archivo Excel.", ex);
        }
    }
}
