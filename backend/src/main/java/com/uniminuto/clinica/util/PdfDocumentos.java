package com.uniminuto.clinica.util;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.uniminuto.clinica.models.DespachoDetalleRs;
import com.uniminuto.clinica.models.DespachoRs;
import com.uniminuto.clinica.models.FormulaDetalleRs;
import com.uniminuto.clinica.models.FormulaRs;
import com.uniminuto.clinica.models.LineaCobroRs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Genera los documentos PDF de la clínica (fórmula médica y comprobante de
 * despacho) con OpenPDF.
 */
@Component
public class PdfDocumentos {

    /**
     * Formato de fecha de los documentos.
     */
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Formato de fecha y hora de los documentos.
     */
    private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a");

    /**
     * Color institucional de los encabezados.
     */
    private static final Color COLOR = new Color(4, 169, 245);

    /**
     * Fuentes del documento.
     */
    private static final Font TITULO = new Font(Font.HELVETICA, 16, Font.BOLD, COLOR);
    private static final Font SUBTITULO = new Font(Font.HELVETICA, 11, Font.BOLD);
    private static final Font NORMAL = new Font(Font.HELVETICA, 9);
    private static final Font NEGRITA = new Font(Font.HELVETICA, 9, Font.BOLD);
    private static final Font CABECERA = new Font(Font.HELVETICA, 8, Font.BOLD, Color.WHITE);
    private static final Font PEQUENA = new Font(Font.HELVETICA, 7, Font.NORMAL, Color.GRAY);

    /**
     * Nombre de la clínica.
     */
    @Value("${clinica.empresa.nombre:Clínica Veterinaria}")
    private String empresa;

    /**
     * NIT de la clínica.
     */
    @Value("${clinica.empresa.nit:}")
    private String nit;

    /**
     * Dirección de la clínica.
     */
    @Value("${clinica.empresa.direccion:}")
    private String direccion;

    /**
     * Teléfono de la clínica.
     */
    @Value("${clinica.empresa.telefono:}")
    private String telefono;

    /**
     * Genera la fórmula médica.
     *
     * @param f fórmula con sus líneas.
     * @return contenido del PDF.
     */
    public byte[] formula(FormulaRs f) {
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.LETTER, 36, 36, 36, 36);
        PdfWriter.getInstance(doc, salida);
        doc.open();
        this.encabezado(doc, "FÓRMULA MÉDICA N.° " + f.getFormulaId());

        PdfPTable datos = this.tablaDatos();
        this.dato(datos, "Fecha de emisión", fecha(f.getFechaEmision()));
        this.dato(datos, "Estado", texto(f.getEstado()));
        this.dato(datos, "Mascota", texto(f.getMascotaNombre()));
        this.dato(datos, "Propietario", texto(f.getClienteNombre()));
        this.dato(datos, "Médico veterinario", texto(f.getMedicoNombre()));
        this.dato(datos, "Historia clínica", f.getHistoriaId() == null ? "-"
                : "N.° " + f.getHistoriaId() + " del " + fecha(f.getHistoriaFecha()));
        doc.add(datos);

        doc.add(new Paragraph("Medicamentos formulados", SUBTITULO));
        PdfPTable tabla = new PdfPTable(new float[]{2.6f, 1.2f, 1.2f, 1f, 1.2f, 0.9f, 3f});
        tabla.setWidthPercentage(100);
        tabla.setSpacingBefore(6);
        for (String c : new String[]{"Medicamento", "Dosis", "Frecuencia", "Duración", "Vía", "Cant.", "Indicaciones"}) {
            tabla.addCell(this.cabecera(c));
        }
        if (f.getDetalles() != null) {
            for (FormulaDetalleRs d : f.getDetalles()) {
                tabla.addCell(this.celda(texto(d.getMedicamentoNombre())
                        + (d.getPresentacion() == null ? "" : "\n" + d.getPresentacion())));
                tabla.addCell(this.celda(numero(d.getDosis()) + " " + texto(d.getUnidadDosis())));
                tabla.addCell(this.celda("Cada " + d.getFrecuenciaHoras() + " h"));
                tabla.addCell(this.celda(d.getDuracionDias() + (d.getDuracionDias() != null && d.getDuracionDias() == 1
                        ? " día" : " días")));
                tabla.addCell(this.celda(texto(d.getViaAdministracion())));
                tabla.addCell(this.celda(String.valueOf(d.getCantidadPrescrita())));
                tabla.addCell(this.celda(texto(d.getIndicaciones())));
            }
        }
        doc.add(tabla);

        if (f.getObservaciones() != null && !f.getObservaciones().isBlank()) {
            Paragraph obs = new Paragraph();
            obs.setSpacingBefore(10);
            obs.add(new Chunk("Observaciones: ", NEGRITA));
            obs.add(new Chunk(f.getObservaciones(), NORMAL));
            doc.add(obs);
        }

        this.firma(doc, texto(f.getMedicoNombre()), "Médico veterinario");
        this.pie(doc);
        doc.close();
        return salida.toByteArray();
    }

    /**
     * Genera el comprobante de una entrega de medicamentos.
     *
     * @param d entrega con sus líneas.
     * @param f fórmula a la que pertenece.
     * @return contenido del PDF.
     */
    public byte[] comprobanteDespacho(DespachoRs d, FormulaRs f) {
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.LETTER, 36, 36, 36, 36);
        PdfWriter.getInstance(doc, salida);
        doc.open();
        this.encabezado(doc, "COMPROBANTE DE DESPACHO N.° " + d.getDespachoId());

        PdfPTable datos = this.tablaDatos();
        this.dato(datos, "Fecha y hora", fechaHora(d.getFecha()));
        this.dato(datos, "Fórmula", "N.° " + d.getFormulaId() + " del " + fecha(f.getFechaEmision()));
        this.dato(datos, "Mascota", texto(d.getMascotaNombre()));
        this.dato(datos, "Propietario", texto(d.getClienteNombre()));
        this.dato(datos, "Médico veterinario", texto(d.getMedicoNombre()));
        this.dato(datos, "Entregado por", texto(d.getUsuario()));
        this.dato(datos, "Estado de la entrega", texto(d.getEstado()));
        this.dato(datos, "Estado de la fórmula", texto(d.getEstadoDespachoFormula()).replace('_', ' '));
        doc.add(datos);

        doc.add(new Paragraph("Medicamentos entregados", SUBTITULO));
        PdfPTable tabla = new PdfPTable(new float[]{1.2f, 3.5f, 1.6f, 1.4f, 1f});
        tabla.setWidthPercentage(100);
        tabla.setSpacingBefore(6);
        for (String c : new String[]{"Código", "Medicamento", "Lote", "Vence", "Cantidad"}) {
            tabla.addCell(this.cabecera(c));
        }
        int total = 0;
        if (d.getDetalles() != null) {
            for (DespachoDetalleRs l : d.getDetalles()) {
                tabla.addCell(this.celda(texto(l.getMedicamentoCodigo())));
                tabla.addCell(this.celda(texto(l.getMedicamentoNombre())));
                tabla.addCell(this.celda(texto(l.getNumeroLote())));
                tabla.addCell(this.celda(fecha(l.getFechaVencimiento())));
                tabla.addCell(this.celda(String.valueOf(l.getCantidad())));
                total += l.getCantidad() == null ? 0 : l.getCantidad();
            }
        }
        PdfPCell etiqueta = new PdfPCell(new Phrase("Total de unidades", NEGRITA));
        etiqueta.setColspan(4);
        etiqueta.setHorizontalAlignment(Element.ALIGN_RIGHT);
        etiqueta.setPadding(4);
        tabla.addCell(etiqueta);
        PdfPCell valor = new PdfPCell(new Phrase(String.valueOf(total), NEGRITA));
        valor.setPadding(4);
        tabla.addCell(valor);
        doc.add(tabla);

        if (d.getObservacion() != null && !d.getObservacion().isBlank()) {
            Paragraph obs = new Paragraph();
            obs.setSpacingBefore(10);
            obs.add(new Chunk("Observación: ", NEGRITA));
            obs.add(new Chunk(d.getObservacion(), NORMAL));
            doc.add(obs);
        }
        if ("REVERTIDO".equals(d.getEstado())) {
            Paragraph rev = new Paragraph("ENTREGA REVERTIDA el " + fechaHora(d.getFechaReversion()) + " por "
                    + texto(d.getUsuarioReversion()) + ". Motivo: " + texto(d.getMotivoReversion()),
                    new Font(Font.HELVETICA, 9, Font.BOLD, Color.RED));
            rev.setSpacingBefore(10);
            doc.add(rev);
        }

        this.firma(doc, texto(d.getUsuario()), "Despacho médico");
        this.pie(doc);
        doc.close();
        return salida.toByteArray();
    }

    /**
     * Agrega los datos de la clínica y el título del documento.
     */
    private void encabezado(Document doc, String titulo) {
        Paragraph nombre = new Paragraph(empresa, TITULO);
        nombre.setAlignment(Element.ALIGN_CENTER);
        doc.add(nombre);
        StringBuilder linea = new StringBuilder();
        if (!nit.isBlank()) {
            linea.append("NIT ").append(nit);
        }
        if (!direccion.isBlank()) {
            linea.append(linea.isEmpty() ? "" : " · ").append(direccion);
        }
        if (!telefono.isBlank()) {
            linea.append(linea.isEmpty() ? "" : " · ").append("Tel. ").append(telefono);
        }
        Paragraph contacto = new Paragraph(linea.toString(), NORMAL);
        contacto.setAlignment(Element.ALIGN_CENTER);
        doc.add(contacto);
        Paragraph t = new Paragraph(titulo, SUBTITULO);
        t.setAlignment(Element.ALIGN_CENTER);
        t.setSpacingBefore(12);
        t.setSpacingAfter(8);
        doc.add(t);
    }

    /**
     * Tabla de dos pares etiqueta-valor por fila, sin bordes.
     */
    private PdfPTable tablaDatos() {
        PdfPTable tabla = new PdfPTable(new float[]{1.3f, 2.2f, 1.3f, 2.2f});
        tabla.setWidthPercentage(100);
        tabla.setSpacingAfter(10);
        tabla.getDefaultCell().setBorder(Rectangle.NO_BORDER);
        return tabla;
    }

    /**
     * Agrega una etiqueta y su valor.
     */
    private void dato(PdfPTable tabla, String etiqueta, String valor) {
        PdfPCell e = new PdfPCell(new Phrase(etiqueta + ":", NEGRITA));
        e.setBorder(Rectangle.NO_BORDER);
        e.setPadding(2);
        tabla.addCell(e);
        PdfPCell v = new PdfPCell(new Phrase(valor, NORMAL));
        v.setBorder(Rectangle.NO_BORDER);
        v.setPadding(2);
        tabla.addCell(v);
    }

    /**
     * Celda de cabecera de tabla.
     */
    private PdfPCell cabecera(String texto) {
        PdfPCell c = new PdfPCell(new Phrase(texto, CABECERA));
        c.setBackgroundColor(COLOR);
        c.setPadding(4);
        return c;
    }

    /**
     * Celda normal de tabla.
     */
    private PdfPCell celda(String texto) {
        PdfPCell c = new PdfPCell(new Phrase(texto, NORMAL));
        c.setPadding(4);
        return c;
    }

    /**
     * Línea de firma.
     */
    private void firma(Document doc, String nombre, String cargo) {
        Paragraph p = new Paragraph("\n\n\n______________________________\n" + nombre + "\n" + cargo, NORMAL);
        p.setSpacingBefore(20);
        doc.add(p);
    }

    /**
     * Fecha de generación del documento.
     */
    private void pie(Document doc) {
        Paragraph p = new Paragraph("Documento generado el " + fechaHora(LocalDateTime.now()), PEQUENA);
        p.setSpacingBefore(20);
        p.setAlignment(Element.ALIGN_RIGHT);
        doc.add(p);
    }

    /**
     * Documento de cobro (prefactura o factura): datos del encabezado, líneas de
     * servicios y medicamentos, totales, información adicional y nota al pie.
     *
     * @param titulo    título (por ejemplo "FACTURA DE VENTA N.° FV-000001").
     * @param datos     pares etiqueta / valor del encabezado.
     * @param lineas    líneas de cobro ya calculadas.
     * @param subtotal  subtotal.
     * @param descuento descuento.
     * @param iva       IVA.
     * @param total     total.
     * @param extras    filas adicionales bajo los totales (pagos, saldo, estado...).
     * @param nota      nota al pie (puede ser null).
     * @return contenido del PDF.
     */
    public byte[] documentoCobro(String titulo, String[][] datos, List<LineaCobroRs> lineas, BigDecimal subtotal,
                                 BigDecimal descuento, BigDecimal iva, BigDecimal total, List<String[]> extras,
                                 String nota) {
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.LETTER, 36, 36, 36, 36);
        PdfWriter.getInstance(doc, salida);
        doc.open();
        this.encabezado(doc, titulo);

        PdfPTable tablaDatos = this.tablaDatos();
        for (String[] d : datos) {
            this.dato(tablaDatos, d[0], texto(d[1]));
        }
        if (datos.length % 2 != 0) {
            this.dato(tablaDatos, "", "");
        }
        doc.add(tablaDatos);

        for (String tipo : new String[]{"SERVICIO", "MEDICAMENTO"}) {
            List<LineaCobroRs> grupo = lineas.stream().filter(l -> tipo.equals(l.getTipo())).toList();
            if (grupo.isEmpty()) {
                continue;
            }
            doc.add(new Paragraph("SERVICIO".equals(tipo) ? "Servicios prestados" : "Medicamentos y productos", SUBTITULO));
            PdfPTable tabla = new PdfPTable(new float[]{1.2f, 3.4f, 0.8f, 1.5f, 0.8f, 1.4f, 1.4f, 1.6f});
            tabla.setWidthPercentage(100);
            tabla.setSpacingBefore(4);
            tabla.setSpacingAfter(8);
            for (String c : new String[]{"Código", "Descripción", "Cant.", "Vr. unitario", "IVA %", "Descuento", "IVA", "Total"}) {
                tabla.addCell(this.cabecera(c));
            }
            for (LineaCobroRs l : grupo) {
                tabla.addCell(this.celda(texto(l.getCodigo())));
                tabla.addCell(this.celda(l.getDescripcion() + (l.getObservacion() == null ? "" : "\n" + l.getObservacion())));
                tabla.addCell(this.celdaNumero(String.valueOf(l.getCantidad())));
                tabla.addCell(this.celdaNumero(moneda(l.getValorUnitario())));
                tabla.addCell(this.celdaNumero(numero(l.getIvaPorcentaje())));
                tabla.addCell(this.celdaNumero(moneda(l.getDescuento())));
                tabla.addCell(this.celdaNumero(moneda(l.getIva())));
                tabla.addCell(this.celdaNumero(moneda(l.getTotal())));
            }
            doc.add(tabla);
        }

        PdfPTable totales = new PdfPTable(new float[]{3f, 1.6f});
        totales.setWidthPercentage(45);
        totales.setHorizontalAlignment(Element.ALIGN_RIGHT);
        String[][] filas = {{"Subtotal", moneda(subtotal)}, {"Descuento", "-" + moneda(descuento)},
            {"IVA", moneda(iva)}, {"Total a pagar", moneda(total)}};
        for (int i = 0; i < filas.length; i++) {
            Font f = i == filas.length - 1 ? NEGRITA : NORMAL;
            PdfPCell e = new PdfPCell(new Phrase(filas[i][0], f));
            e.setPadding(4);
            totales.addCell(e);
            PdfPCell v = new PdfPCell(new Phrase(filas[i][1], f));
            v.setPadding(4);
            v.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totales.addCell(v);
        }
        for (String[] x : extras) {
            PdfPCell e = new PdfPCell(new Phrase(x[0], NORMAL));
            e.setPadding(4);
            totales.addCell(e);
            PdfPCell v = new PdfPCell(new Phrase(x[1], NEGRITA));
            v.setPadding(4);
            v.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totales.addCell(v);
        }
        doc.add(totales);

        if (nota != null && !nota.isBlank()) {
            Paragraph p = new Paragraph(nota, PEQUENA);
            p.setSpacingBefore(12);
            doc.add(p);
        }
        this.pie(doc);
        doc.close();
        return salida.toByteArray();
    }

    /**
     * Reporte en PDF horizontal: encabezado de la clínica, título, filtros, fecha de
     * generación, tabla con las columnas del reporte, fila de totales y resumen.
     *
     * @param r reporte generado.
     * @return contenido del PDF.
     */
    public byte[] reporte(com.uniminuto.clinica.models.ReporteRs r) {
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.LETTER.rotate(), 28, 28, 28, 28);
        PdfWriter.getInstance(doc, salida);
        doc.open();
        this.encabezado(doc, r.getTitulo().toUpperCase());
        Paragraph info = new Paragraph(r.getCategoria() + (r.getFiltrosAplicados() == null || r.getFiltrosAplicados().isBlank()
                ? "" : " · " + r.getFiltrosAplicados()) + " · Generado por " + r.getUsuario() + " el "
                + fechaHora(r.getGenerado()), NORMAL);
        info.setAlignment(Element.ALIGN_CENTER);
        info.setSpacingAfter(8);
        doc.add(info);

        List<com.uniminuto.clinica.models.ReporteRs.Columna> cols = r.getColumnas();
        PdfPTable tabla = new PdfPTable(cols.size());
        tabla.setWidthPercentage(100);
        tabla.setHeaderRows(1);
        for (var c : cols) {
            tabla.addCell(this.cabecera(c.getTitulo()));
        }
        if (r.getFilas().isEmpty()) {
            PdfPCell vacio = new PdfPCell(new Phrase("Sin datos para los filtros seleccionados", NORMAL));
            vacio.setColspan(cols.size());
            vacio.setPadding(6);
            vacio.setHorizontalAlignment(Element.ALIGN_CENTER);
            tabla.addCell(vacio);
        }
        for (var fila : r.getFilas()) {
            for (var c : cols) {
                String texto = formatoReporte(fila.get(c.getClave()), c.getTipo());
                tabla.addCell(esNumerico(c.getTipo()) ? this.celdaNumero(texto) : this.celda(texto));
            }
        }
        if (!r.getTotales().isEmpty()) {
            for (int i = 0; i < cols.size(); i++) {
                var c = cols.get(i);
                Object v = r.getTotales().get(c.getClave());
                String texto = i == 0 ? "Totales" : v == null ? "" : formatoReporte(v, c.getTipo());
                PdfPCell celda = new PdfPCell(new Phrase(texto, NEGRITA));
                celda.setPadding(4);
                celda.setBackgroundColor(new Color(235, 245, 252));
                if (i > 0) {
                    celda.setHorizontalAlignment(Element.ALIGN_RIGHT);
                }
                tabla.addCell(celda);
            }
        }
        doc.add(tabla);

        if (!r.getResumen().isEmpty()) {
            Paragraph res = new Paragraph();
            res.setSpacingBefore(10);
            r.getResumen().forEach((k, v) -> {
                res.add(new Chunk(k + ": ", NEGRITA));
                res.add(new Chunk((v instanceof BigDecimal b ? moneda(b) : String.valueOf(v)) + "     ", NORMAL));
            });
            doc.add(res);
        }
        Paragraph registros = new Paragraph(r.getFilas().size() + " registros", PEQUENA);
        registros.setSpacingBefore(6);
        doc.add(registros);
        doc.close();
        return salida.toByteArray();
    }

    /**
     * Texto de un valor de reporte según el tipo de columna.
     *
     * @param v    valor.
     * @param tipo tipo de la columna.
     * @return texto.
     */
    public static String formatoReporte(Object v, String tipo) {
        if (v == null) {
            return "";
        }
        return switch (tipo) {
            case "MONEDA" -> moneda(v instanceof BigDecimal b ? b : new BigDecimal(v.toString()));
            case "PORCENTAJE" -> numero(v instanceof BigDecimal b ? b : new BigDecimal(v.toString())) + " %";
            case "FECHA" -> v instanceof LocalDate d ? d.format(FECHA) : v.toString();
            case "FECHA_HORA" -> v instanceof LocalDateTime d ? d.format(FECHA_HORA) : v.toString();
            case "ENTERO" -> v instanceof Number n ? String.valueOf(n.longValue()) : v.toString();
            default -> v.toString();
        };
    }

    private static boolean esNumerico(String tipo) {
        return "MONEDA".equals(tipo) || "ENTERO".equals(tipo) || "PORCENTAJE".equals(tipo);
    }

    /**
     * Celda alineada a la derecha para valores numéricos.
     */
    private PdfPCell celdaNumero(String texto) {
        PdfPCell c = this.celda(texto);
        c.setHorizontalAlignment(Element.ALIGN_RIGHT);
        return c;
    }

    /**
     * Valor en pesos colombianos con separador de miles.
     *
     * @param valor valor.
     * @return texto como "$ 60.000".
     */
    public static String moneda(BigDecimal valor) {
        BigDecimal v = valor == null ? BigDecimal.ZERO : valor;
        NumberFormat f = NumberFormat.getNumberInstance(Locale.forLanguageTag("es-CO"));
        boolean conCentavos = v.stripTrailingZeros().scale() > 0;
        f.setMinimumFractionDigits(conCentavos ? 2 : 0);
        f.setMaximumFractionDigits(2);
        return "$ " + f.format(v);
    }

    private static String texto(String valor) {
        return valor == null || valor.isBlank() ? "-" : valor;
    }

    private static String numero(BigDecimal valor) {
        return valor == null ? "-" : valor.stripTrailingZeros().toPlainString();
    }

    private static String fecha(LocalDate valor) {
        return valor == null ? "-" : valor.format(FECHA);
    }

    private static String fechaHora(LocalDateTime valor) {
        return valor == null ? "-" : valor.format(FECHA_HORA);
    }
}
