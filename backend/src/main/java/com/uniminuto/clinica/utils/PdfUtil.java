package com.uniminuto.clinica.utils;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;

/**
 * Utilidades comunes para construir documentos PDF con OpenPDF.
 */
public final class PdfUtil {

    public static final Color PRIMARIO = new Color(13, 71, 161);
    public static final Color GRIS = new Color(236, 239, 241);
    public static final Color GRIS_OSCURO = new Color(84, 110, 122);

    private PdfUtil() {
    }

    /** Contenedor de un documento en construcción. */
    public record Pdf(Document doc, ByteArrayOutputStream salida) {
        public byte[] cerrar() {
            doc.close();
            return salida.toByteArray();
        }
    }

    public static Pdf nuevo(boolean horizontal, String pie) throws Exception {
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        Document doc = new Document(horizontal ? PageSize.A4.rotate() : PageSize.A4, 36, 36, 36, 48);
        PdfWriter writer = PdfWriter.getInstance(doc, salida);
        writer.setPageEvent(new PieDePagina(pie));
        doc.open();
        return new Pdf(doc, salida);
    }

    public static Font fuente(float tamano, int estilo) {
        return FontFactory.getFont(FontFactory.HELVETICA, tamano, estilo);
    }

    public static Font fuente(float tamano, int estilo, Color color) {
        return FontFactory.getFont(FontFactory.HELVETICA, tamano, estilo, color);
    }

    /** Encabezado: datos de la clínica a la izquierda y título/número/fecha a la derecha. */
    public static void encabezado(Document doc, DatosClinica clinica, String titulo, String numero, String fecha)
            throws Exception {
        PdfPTable t = new PdfPTable(new float[]{3f, 2f});
        t.setWidthPercentage(100);
        PdfPCell izq = new PdfPCell();
        izq.setBorder(Rectangle.NO_BORDER);
        izq.addElement(new Paragraph(clinica.getNombre(), fuente(14, Font.BOLD, PRIMARIO)));
        izq.addElement(new Paragraph(clinica.getNit(), fuente(8, Font.NORMAL, GRIS_OSCURO)));
        izq.addElement(new Paragraph(clinica.getDireccion() + "  ·  Tel. " + clinica.getTelefono(),
                fuente(8, Font.NORMAL, GRIS_OSCURO)));
        PdfPCell der = new PdfPCell();
        der.setBorder(Rectangle.NO_BORDER);
        Paragraph pt = new Paragraph(titulo, fuente(13, Font.BOLD));
        pt.setAlignment(Element.ALIGN_RIGHT);
        der.addElement(pt);
        if (numero != null) {
            Paragraph pn = new Paragraph(numero, fuente(11, Font.BOLD, PRIMARIO));
            pn.setAlignment(Element.ALIGN_RIGHT);
            der.addElement(pn);
        }
        if (fecha != null) {
            Paragraph pf = new Paragraph(fecha, fuente(8, Font.NORMAL, GRIS_OSCURO));
            pf.setAlignment(Element.ALIGN_RIGHT);
            der.addElement(pf);
        }
        t.addCell(izq);
        t.addCell(der);
        doc.add(t);
        linea(doc);
    }

    public static void linea(Document doc) throws Exception {
        PdfPTable l = new PdfPTable(1);
        l.setWidthPercentage(100);
        l.setSpacingBefore(4);
        l.setSpacingAfter(6);
        PdfPCell c = new PdfPCell(new Phrase(""));
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(PRIMARIO);
        c.setBorderWidth(1.2f);
        c.setFixedHeight(2);
        l.addCell(c);
        doc.add(l);
    }

    public static void seccion(Document doc, String titulo) throws Exception {
        Paragraph p = new Paragraph(titulo.toUpperCase(), fuente(9, Font.BOLD, PRIMARIO));
        p.setSpacingBefore(8);
        p.setSpacingAfter(3);
        doc.add(p);
    }

    public static void parrafo(Document doc, String texto) throws Exception {
        Paragraph p = new Paragraph(texto == null || texto.isBlank() ? "—" : texto, fuente(9, Font.NORMAL));
        p.setSpacingAfter(2);
        doc.add(p);
    }

    /** Tabla de pares etiqueta/valor en N columnas de pares. */
    public static void datos(Document doc, int paresPorFila, String... etiquetasYValores) throws Exception {
        float[] anchos = new float[paresPorFila * 2];
        for (int i = 0; i < anchos.length; i++) {
            anchos[i] = i % 2 == 0 ? 1.1f : 2f;
        }
        PdfPTable t = new PdfPTable(anchos);
        t.setWidthPercentage(100);
        for (int i = 0; i < etiquetasYValores.length; i += 2) {
            PdfPCell e = new PdfPCell(new Phrase(etiquetasYValores[i], fuente(8, Font.BOLD, GRIS_OSCURO)));
            e.setBorder(Rectangle.NO_BORDER);
            e.setPadding(2);
            PdfPCell v = new PdfPCell(new Phrase(etiquetasYValores[i + 1] == null ? "" : etiquetasYValores[i + 1],
                    fuente(9, Font.NORMAL)));
            v.setBorder(Rectangle.NO_BORDER);
            v.setPadding(2);
            t.addCell(e);
            t.addCell(v);
        }
        int resto = (etiquetasYValores.length / 2) % paresPorFila;
        if (resto != 0) {
            for (int i = 0; i < (paresPorFila - resto) * 2; i++) {
                PdfPCell vacia = new PdfPCell(new Phrase(""));
                vacia.setBorder(Rectangle.NO_BORDER);
                t.addCell(vacia);
            }
        }
        doc.add(t);
    }

    public static PdfPTable tabla(float... anchos) {
        PdfPTable t = new PdfPTable(anchos);
        t.setWidthPercentage(100);
        t.setSpacingBefore(4);
        t.setHeaderRows(1);
        return t;
    }

    public static PdfPCell th(String texto) {
        PdfPCell c = new PdfPCell(new Phrase(texto, fuente(8, Font.BOLD, Color.WHITE)));
        c.setBackgroundColor(PRIMARIO);
        c.setPadding(4);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return c;
    }

    public static PdfPCell td(String texto) {
        return td(texto, Element.ALIGN_LEFT, false);
    }

    public static PdfPCell tdDerecha(String texto) {
        return td(texto, Element.ALIGN_RIGHT, false);
    }

    public static PdfPCell td(String texto, int alineacion, boolean negrita) {
        PdfPCell c = new PdfPCell(new Phrase(texto == null ? "" : texto, fuente(8, negrita ? Font.BOLD : Font.NORMAL)));
        c.setPadding(3);
        c.setHorizontalAlignment(alineacion);
        c.setBorderColor(new Color(207, 216, 220));
        if (negrita) {
            c.setBackgroundColor(GRIS);
        }
        return c;
    }

    public static void firma(Document doc, String nombre, String cargo) throws Exception {
        Paragraph espacio = new Paragraph(" ");
        espacio.setSpacingBefore(30);
        doc.add(espacio);
        Paragraph l = new Paragraph("______________________________", fuente(9, Font.NORMAL));
        doc.add(l);
        doc.add(new Paragraph(nombre, fuente(9, Font.BOLD)));
        doc.add(new Paragraph(cargo, fuente(8, Font.NORMAL, GRIS_OSCURO)));
    }

    /** Numeración de página y fecha de generación en el pie. */
    private static class PieDePagina extends PdfPageEventHelper {
        private final String texto;

        PieDePagina(String texto) {
            this.texto = texto;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            Rectangle pagina = document.getPageSize();
            String pie = (texto == null ? "" : texto + "  ·  ") + "Generado: "
                    + Formato.fechaHora(LocalDateTime.now()) + "  ·  Página " + writer.getPageNumber();
            ColumnText.showTextAligned(writer.getDirectContent(), Element.ALIGN_CENTER,
                    new Phrase(pie, fuente(7, Font.NORMAL, GRIS_OSCURO)),
                    (pagina.getLeft() + pagina.getRight()) / 2, pagina.getBottom() + 24, 0);
        }
    }
}
