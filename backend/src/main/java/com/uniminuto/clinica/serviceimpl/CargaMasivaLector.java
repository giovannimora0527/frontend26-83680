package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.exception.BadRequestException;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

import java.io.ByteArrayInputStream;
import java.io.StringReader;
import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Lee archivos .xlsx y .csv y devuelve las filas como mapas columna -> valor
 * (encabezados normalizados: minúsculas, sin tildes, espacios como "_").
 */
final class CargaMasivaLector {

    static final int MAX_FILAS = 5000;

    record Lectura(List<String> encabezados, List<FilaLeida> filas) {
    }

    record FilaLeida(int numero, Map<String, String> valores) {
    }

    private CargaMasivaLector() {
    }

    static Lectura leer(String nombreArchivo, byte[] contenido) {
        String nombre = nombreArchivo == null ? "" : nombreArchivo.toLowerCase(Locale.ROOT);
        if (nombre.endsWith(".xlsx")) {
            return leerXlsx(contenido);
        }
        if (nombre.endsWith(".csv")) {
            return leerCsv(contenido);
        }
        throw new BadRequestException("Formato no soportado. Use un archivo .xlsx o .csv.");
    }

    static String normalizar(String encabezado) {
        if (encabezado == null) {
            return "";
        }
        String s = Normalizer.normalize(encabezado.replace("\uFEFF", "").trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return s.replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
    }

    private static Lectura leerCsv(byte[] contenido) {
        String texto = new String(contenido, StandardCharsets.UTF_8);
        if (texto.contains("\uFFFD")) {
            texto = new String(contenido, Charset.forName("windows-1252"));
        }
        texto = texto.replace("\uFEFF", "");
        String primera = texto.lines().findFirst().orElse("");
        char delimitador = contar(primera, ';') > contar(primera, ',') ? ';' : ',';
        CSVFormat formato = CSVFormat.DEFAULT.builder()
                .setDelimiter(delimitador)
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true)
                .setTrim(true)
                .build();
        try (CSVParser parser = formato.parse(new StringReader(texto))) {
            List<String> originales = parser.getHeaderNames();
            List<String> encabezados = originales.stream().map(CargaMasivaLector::normalizar).toList();
            List<FilaLeida> filas = new ArrayList<>();
            for (CSVRecord rec : parser) {
                Map<String, String> valores = new LinkedHashMap<>();
                boolean vacia = true;
                for (int i = 0; i < encabezados.size(); i++) {
                    String v = i < rec.size() ? rec.get(i).trim() : "";
                    if (!v.isEmpty()) {
                        vacia = false;
                    }
                    valores.put(encabezados.get(i), v);
                }
                if (!vacia) {
                    filas.add(new FilaLeida((int) rec.getRecordNumber() + 1, valores));
                }
                if (filas.size() > MAX_FILAS) {
                    throw new BadRequestException("El archivo supera el máximo de " + MAX_FILAS + " registros.");
                }
            }
            return new Lectura(encabezados, filas);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("No fue posible leer el archivo CSV: " + e.getMessage());
        }
    }

    private static Lectura leerXlsx(byte[] contenido) {
        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(contenido))) {
            Sheet hoja = wb.getSheetAt(0);
            Row cabecera = hoja.getRow(hoja.getFirstRowNum());
            if (cabecera == null) {
                throw new BadRequestException("La primera hoja del archivo está vacía.");
            }
            List<String> encabezados = new ArrayList<>();
            for (int c = 0; c < cabecera.getLastCellNum(); c++) {
                encabezados.add(normalizar(valor(cabecera.getCell(c))));
            }
            List<FilaLeida> filas = new ArrayList<>();
            for (int r = cabecera.getRowNum() + 1; r <= hoja.getLastRowNum(); r++) {
                Row fila = hoja.getRow(r);
                if (fila == null) {
                    continue;
                }
                Map<String, String> valores = new LinkedHashMap<>();
                boolean vacia = true;
                for (int c = 0; c < encabezados.size(); c++) {
                    String v = valor(fila.getCell(c));
                    if (!v.isEmpty()) {
                        vacia = false;
                    }
                    valores.put(encabezados.get(c), v);
                }
                if (!vacia) {
                    filas.add(new FilaLeida(r + 1, valores));
                }
                if (filas.size() > MAX_FILAS) {
                    throw new BadRequestException("El archivo supera el máximo de " + MAX_FILAS + " registros.");
                }
            }
            return new Lectura(encabezados, filas);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("No fue posible leer el archivo Excel: " + e.getMessage());
        }
    }

    /** Valor de celda como texto; fechas en ISO (yyyy-MM-dd) y números sin formato regional. */
    private static String valor(Cell cell) {
        if (cell == null) {
            return "";
        }
        CellType tipo = cell.getCellType() == CellType.FORMULA ? cell.getCachedFormulaResultType() : cell.getCellType();
        switch (tipo) {
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate().toString();
                }
                return BigDecimal.valueOf(cell.getNumericCellValue()).stripTrailingZeros().toPlainString();
            case STRING:
                return cell.getStringCellValue().trim();
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }

    private static int contar(String s, char c) {
        int n = 0;
        for (char x : s.toCharArray()) {
            if (x == c) {
                n++;
            }
        }
        return n;
    }
}
