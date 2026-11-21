package com.uniminuto.clinica.utils;

import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.uniminuto.clinica.models.ReporteData;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Exporta un {@link ReporteData} a PDF y Excel con encabezado, fecha de
 * generación y fila de totales.
 */
@Component
public class ReporteRenderer {

    @Autowired
    private DatosClinica clinica;

    public byte[] pdf(ReporteData r) {
        try {
            int n = r.getColumnas().size();
            PdfUtil.Pdf pdf = PdfUtil.nuevo(n > 6, r.getTitulo());
            PdfUtil.encabezado(pdf.doc(), clinica, r.getTitulo(), null,
                    "Generado: " + Formato.fechaHora(r.getGenerado())
                            + (r.getGeneradoPor() == null ? "" : " por " + r.getGeneradoPor()));
            if (r.getSubtitulo() != null) {
                pdf.doc().add(new Paragraph(r.getSubtitulo(), PdfUtil.fuente(9, Font.ITALIC, PdfUtil.GRIS_OSCURO)));
            }
            float[] anchos = new float[n];
            for (int i = 0; i < n; i++) {
                anchos[i] = "TEXTO".equals(r.getTipos().get(i)) ? 2.2f : 1.3f;
            }
            PdfPTable t = PdfUtil.tabla(anchos);
            for (String c : r.getColumnas()) {
                t.addCell(PdfUtil.th(c));
            }
            for (List<Object> fila : r.getFilas()) {
                for (int i = 0; i < n; i++) {
                    Object v = i < fila.size() ? fila.get(i) : null;
                    t.addCell(PdfUtil.td(formatear(v, r.getTipos().get(i)), alineacion(r.getTipos().get(i)), false));
                }
            }
            if (r.getFilas().isEmpty()) {
                com.lowagie.text.pdf.PdfPCell vacia = PdfUtil.td("Sin registros para los filtros seleccionados.");
                vacia.setColspan(n);
                t.addCell(vacia);
            }
            if (r.getTotales() != null) {
                for (int i = 0; i < n; i++) {
                    Object v = i < r.getTotales().size() ? r.getTotales().get(i) : null;
                    t.addCell(PdfUtil.td(formatear(v, r.getTipos().get(i)), alineacion(r.getTipos().get(i)), true));
                }
            }
            pdf.doc().add(t);
            Paragraph cuenta = new Paragraph("Registros: " + r.getFilas().size(), PdfUtil.fuente(8, Font.NORMAL));
            cuenta.setSpacingBefore(4);
            pdf.doc().add(cuenta);
            return pdf.cerrar();
        } catch (Exception ex) {
            throw new IllegalStateException("No fue posible generar el PDF del reporte.", ex);
        }
    }

    public byte[] excel(ReporteData r) {
        XSSFWorkbook wb = new XSSFWorkbook();
        ExcelUtil.Estilos e = new ExcelUtil.Estilos(wb);
        Sheet hoja = wb.createSheet("Reporte");
        int n = r.getColumnas().size();
        Row t = hoja.createRow(0);
        t.createCell(0).setCellValue(clinica.getNombre() + " - " + r.getTitulo());
        t.getCell(0).setCellStyle(e.titulo);
        hoja.addMergedRegion(new CellRangeAddress(0, 0, 0, Math.max(1, n - 1)));
        Row s = hoja.createRow(1);
        s.createCell(0).setCellValue((r.getSubtitulo() == null ? "" : r.getSubtitulo() + "  |  ")
                + "Generado: " + Formato.fechaHora(r.getGenerado())
                + (r.getGeneradoPor() == null ? "" : " por " + r.getGeneradoPor()));
        Row h = hoja.createRow(3);
        for (int i = 0; i < n; i++) {
            h.createCell(i).setCellValue(r.getColumnas().get(i));
            h.getCell(i).setCellStyle(e.encabezado);
        }
        int filaN = 4;
        for (List<Object> fila : r.getFilas()) {
            Row row = hoja.createRow(filaN++);
            for (int i = 0; i < n; i++) {
                ExcelUtil.celda(row, i, i < fila.size() ? fila.get(i) : null, r.getTipos().get(i), e, false);
            }
        }
        if (r.getTotales() != null) {
            Row row = hoja.createRow(filaN);
            for (int i = 0; i < n; i++) {
                ExcelUtil.celda(row, i, i < r.getTotales().size() ? r.getTotales().get(i) : null, r.getTipos().get(i), e, true);
            }
        }
        hoja.createFreezePane(0, 4);
        ExcelUtil.anchos(hoja, r.getColumnas(), r.getFilas());
        return ExcelUtil.bytes(wb);
    }

    private static int alineacion(String tipo) {
        return switch (tipo) {
            case "MONEDA", "ENTERO", "DECIMAL" -> Element.ALIGN_RIGHT;
            case "FECHA", "FECHA_HORA" -> Element.ALIGN_CENTER;
            default -> Element.ALIGN_LEFT;
        };
    }

    private static String formatear(Object v, String tipo) {
        if (v == null) {
            return "";
        }
        if ("MONEDA".equals(tipo) && v instanceof Number num) {
            return Formato.moneda(num instanceof BigDecimal bd ? bd : BigDecimal.valueOf(num.doubleValue()));
        }
        if (v instanceof Number num) {
            return Formato.numero(num);
        }
        return Formato.texto(v);
    }
}
