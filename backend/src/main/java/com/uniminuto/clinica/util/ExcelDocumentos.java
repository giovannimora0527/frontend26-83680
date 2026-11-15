package com.uniminuto.clinica.util;

import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.CitaRs;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Genera los archivos Excel (.xlsx) de la clínica con Apache POI.
 */
@Component
public class ExcelDocumentos {

    /**
     * Formato de fecha.
     */
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Formato de hora.
     */
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    /**
     * Formato de fecha y hora.
     */
    private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    /**
     * Nombre de la clínica.
     */
    @Value("${clinica.empresa.nombre:Clínica Veterinaria}")
    private String empresa;

    /**
     * Reporte de citas: hoja con el detalle y hoja con el resumen por estado.
     *
     * @param citas      citas del período.
     * @param desde      fecha inicial.
     * @param hasta      fecha final.
     * @param medico     veterinario del reporte (o "Todos").
     * @param nombresEstado nombre visible de cada estado.
     * @return contenido del archivo .xlsx.
     */
    public byte[] citas(List<CitaRs> citas, LocalDate desde, LocalDate hasta, String medico,
                        Map<String, String> nombresEstado) {
        try (XSSFWorkbook libro = new XSSFWorkbook(); ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            CellStyle titulo = this.estiloTitulo(libro);
            CellStyle cabecera = this.estiloCabecera(libro);
            CellStyle normal = this.estiloCelda(libro);

            Sheet hoja = libro.createSheet("Citas");
            int fila = this.encabezado(hoja, titulo, "Reporte de citas médicas", desde, hasta, medico);
            String[] columnas = {"N.° cita", "Fecha", "Hora inicio", "Hora fin", "Veterinario", "Especialidad",
                "Mascota", "Raza", "Propietario", "Teléfono", "Motivo", "Estado", "Motivo de cancelación"};
            Row filaCabecera = hoja.createRow(fila++);
            for (int i = 0; i < columnas.length; i++) {
                this.celda(filaCabecera, i, columnas[i], cabecera);
            }
            Map<String, Integer> conteo = new LinkedHashMap<>();
            nombresEstado.keySet().forEach(k -> conteo.put(k, 0));
            for (CitaRs c : citas) {
                Row r = hoja.createRow(fila++);
                int col = 0;
                Cell numero = r.createCell(col++);
                numero.setCellValue(c.getCitaId());
                numero.setCellStyle(normal);
                this.celda(r, col++, c.getFecha().format(FECHA), normal);
                this.celda(r, col++, c.getHora().format(HORA), normal);
                this.celda(r, col++, c.getHoraFin() == null ? "" : c.getHoraFin().format(HORA), normal);
                this.celda(r, col++, c.getMedicoNombre(), normal);
                this.celda(r, col++, c.getEspecialidad(), normal);
                this.celda(r, col++, c.getMascotaNombre(), normal);
                this.celda(r, col++, c.getMascotaRaza(), normal);
                this.celda(r, col++, c.getClienteNombre(), normal);
                this.celda(r, col++, c.getClienteTelefono(), normal);
                this.celda(r, col++, c.getMotivo(), normal);
                this.celda(r, col++, nombresEstado.getOrDefault(c.getEstado(), c.getEstado()), normal);
                this.celda(r, col, c.getMotivoCancelacion(), normal);
                conteo.merge(c.getEstado(), 1, Integer::sum);
            }
            Row total = hoja.createRow(fila + 1);
            this.celda(total, 0, "Total de citas: " + citas.size(), cabecera);
            for (int i = 0; i < columnas.length; i++) {
                hoja.autoSizeColumn(i);
            }
            hoja.createFreezePane(0, 6);

            Sheet resumen = libro.createSheet("Resumen por estado");
            int f2 = this.encabezado(resumen, titulo, "Resumen de citas por estado", desde, hasta, medico);
            Row cab2 = resumen.createRow(f2++);
            this.celda(cab2, 0, "Estado", cabecera);
            this.celda(cab2, 1, "Cantidad", cabecera);
            for (Map.Entry<String, Integer> e : conteo.entrySet()) {
                Row r = resumen.createRow(f2++);
                this.celda(r, 0, nombresEstado.getOrDefault(e.getKey(), e.getKey()), normal);
                Cell c = r.createCell(1);
                c.setCellValue(e.getValue());
                c.setCellStyle(normal);
            }
            Row r = resumen.createRow(f2);
            this.celda(r, 0, "Total", cabecera);
            Cell c = r.createCell(1);
            c.setCellValue(citas.size());
            c.setCellStyle(cabecera);
            resumen.autoSizeColumn(0);
            resumen.autoSizeColumn(1);

            libro.write(salida);
            return salida.toByteArray();
        } catch (IOException ex) {
            throw new BadRequestException("No se pudo generar el archivo Excel");
        }
    }

    /**
     * Escribe el título, el período y la fecha de generación.
     *
     * @return la siguiente fila libre.
     */
    private int encabezado(Sheet hoja, CellStyle titulo, String texto, LocalDate desde, LocalDate hasta,
                           String medico) {
        Row r0 = hoja.createRow(0);
        this.celda(r0, 0, empresa + " — " + texto, titulo);
        hoja.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));
        hoja.createRow(1).createCell(0).setCellValue("Período: " + desde.format(FECHA) + " a " + hasta.format(FECHA));
        hoja.createRow(2).createCell(0).setCellValue("Veterinario: " + medico);
        hoja.createRow(3).createCell(0).setCellValue("Generado: " + LocalDateTime.now().format(FECHA_HORA));
        return 5;
    }

    private void celda(Row fila, int columna, String valor, CellStyle estilo) {
        Cell c = fila.createCell(columna);
        c.setCellValue(valor == null ? "" : valor);
        c.setCellStyle(estilo);
    }

    private CellStyle estiloTitulo(XSSFWorkbook libro) {
        Font f = libro.createFont();
        f.setBold(true);
        f.setFontHeightInPoints((short) 14);
        CellStyle s = libro.createCellStyle();
        s.setFont(f);
        return s;
    }

    private CellStyle estiloCabecera(XSSFWorkbook libro) {
        Font f = libro.createFont();
        f.setBold(true);
        f.setColor(IndexedColors.WHITE.getIndex());
        CellStyle s = libro.createCellStyle();
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        this.bordes(s);
        return s;
    }

    private CellStyle estiloCelda(XSSFWorkbook libro) {
        CellStyle s = libro.createCellStyle();
        this.bordes(s);
        return s;
    }

    private void bordes(CellStyle s) {
        s.setBorderTop(BorderStyle.THIN);
        s.setBorderBottom(BorderStyle.THIN);
        s.setBorderLeft(BorderStyle.THIN);
        s.setBorderRight(BorderStyle.THIN);
    }
}
