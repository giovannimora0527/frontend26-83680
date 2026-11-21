package com.uniminuto.clinica.serviceimpl;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.uniminuto.clinica.entity.AtencionServicio;
import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Despacho;
import com.uniminuto.clinica.entity.DespachoDetalle;
import com.uniminuto.clinica.entity.Factura;
import com.uniminuto.clinica.entity.FacturaDetalle;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.FormulaMedicaDetalle;
import com.uniminuto.clinica.entity.HistoriaMedica;
import com.uniminuto.clinica.entity.Impuesto;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.entity.Pago;
import com.uniminuto.clinica.entity.Tarifa;
import com.uniminuto.clinica.exception.ForbiddenException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.repository.AtencionServicioRepository;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.DespachoRepository;
import com.uniminuto.clinica.repository.FacturaRepository;
import com.uniminuto.clinica.repository.FormulaMedicaRepository;
import com.uniminuto.clinica.repository.HistoriaMedicaRepository;
import com.uniminuto.clinica.security.ContextoUsuario;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.security.UsuarioActual;
import com.uniminuto.clinica.service.DocumentoService;
import com.uniminuto.clinica.utils.Constantes;
import com.uniminuto.clinica.utils.DatosClinica;
import com.uniminuto.clinica.utils.Formato;
import com.uniminuto.clinica.utils.PdfUtil;
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DocumentoServiceImpl implements DocumentoService {

    private static final BigDecimal CIEN = BigDecimal.valueOf(100);

    @Autowired
    private DatosClinica clinica;

    @Autowired
    private FormulaMedicaRepository formulaRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private HistoriaMedicaRepository historiaRepository;

    @Autowired
    private AtencionServicioRepository servicioRepository;

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private DespachoRepository despachoRepository;

    // ------------------------------------------------------------------ fórmula

    @Override
    @Transactional(readOnly = true)
    public byte[] formula(Long formulaId) {
        Validar.idValido(formulaId, "formulaId");
        FormulaMedica f = formulaRepository.findById(formulaId)
                .orElseThrow(() -> new NotFoundException("La fórmula médica no existe."));
        verificarMedico(f.getMedico());
        try {
            PdfUtil.Pdf pdf = PdfUtil.nuevo(false, "Fórmula " + numero(f));
            Document doc = pdf.doc();
            PdfUtil.encabezado(doc, clinica, "FÓRMULA MÉDICA VETERINARIA", numero(f),
                    "Fecha de emisión: " + Formato.fecha(f.getFechaEmision()) + "  ·  Estado: " + f.getEstado());
            bloquePaciente(doc, f.getCita().getCliente(), f.getMascota(), f.getMedico());
            PdfUtil.seccion(doc, "Medicamentos prescritos");
            PdfPTable t = PdfUtil.tabla(3f, 1.6f, 1.3f, 1.2f, 1.1f, 1.3f, 3f);
            for (String h : new String[]{"Medicamento", "Dosis", "Frecuencia", "Duración", "Cantidad", "Vía", "Indicaciones"}) {
                t.addCell(PdfUtil.th(h));
            }
            for (FormulaMedicaDetalle d : f.getDetalles()) {
                t.addCell(PdfUtil.td(d.getMedicamento().getNombre() + "\n" + nvl(d.getMedicamento().getPresentacion())));
                t.addCell(PdfUtil.td(d.getDosis()));
                t.addCell(PdfUtil.td("Cada " + d.getFrecuenciaHoras() + " h", Element.ALIGN_CENTER, false));
                t.addCell(PdfUtil.td(d.getDuracionDias() + " día(s)", Element.ALIGN_CENTER, false));
                t.addCell(PdfUtil.td(d.getCantidadPrescrita() + " " + d.getMedicamento().getUnidadMedida().toLowerCase(),
                        Element.ALIGN_CENTER, false));
                t.addCell(PdfUtil.td(d.getViaAdministracion(), Element.ALIGN_CENTER, false));
                t.addCell(PdfUtil.td(nvl(d.getIndicaciones())));
            }
            doc.add(t);
            PdfUtil.seccion(doc, "Indicaciones generales");
            PdfUtil.parrafo(doc, f.getIndicaciones());
            if (f.getHistoriaId() != null) {
                historiaRepository.findById(f.getHistoriaId()).ifPresent(h -> {
                    try {
                        PdfUtil.seccion(doc, "Diagnóstico");
                        PdfUtil.parrafo(doc, h.getDiagnostico());
                    } catch (Exception e) {
                        throw new IllegalStateException(e);
                    }
                });
            }
            PdfUtil.firma(doc, f.getMedico().nombreCompleto(), "Médico veterinario · Reg. " + f.getMedico().getRegistroProfesional());
            return pdf.cerrar();
        } catch (Exception ex) {
            throw new IllegalStateException("No fue posible generar el PDF de la fórmula.", ex);
        }
    }

    // ------------------------------------------------------------------ prefactura

    @Override
    @Transactional(readOnly = true)
    public byte[] prefactura(Long citaId) {
        Validar.idValido(citaId, "citaId");
        Cita c = citaRepository.findById(citaId).orElseThrow(() -> new NotFoundException("La cita no existe."));
        verificarMedico(c.getMedico());
        List<AtencionServicio> servicios = servicioRepository.findByCita_IdOrderByIdAsc(citaId);
        List<FormulaMedica> formulas = formulaRepository.findByCita_IdOrderByIdAsc(citaId).stream()
                .filter(f -> !Constantes.FORMULA_ANULADA.equals(f.getEstado())).toList();
        HistoriaMedica h = historiaRepository.findByCita_Id(citaId).orElse(null);
        try {
            PdfUtil.Pdf pdf = PdfUtil.nuevo(false, "Prefactura cita #" + c.getId());
            Document doc = pdf.doc();
            PdfUtil.encabezado(doc, clinica, "PREFACTURA", "Cita #" + c.getId(),
                    "Atención: " + Formato.fechaHora(c.getFechaHora()) + "  ·  Documento informativo, no es factura");
            bloquePaciente(doc, c.getCliente(), c.getMascota(), c.getMedico());
            if (h != null) {
                PdfUtil.seccion(doc, "Resumen de la atención");
                PdfUtil.datos(doc, 1, "Motivo", h.getMotivo(), "Diagnóstico", nvl(h.getDiagnostico()),
                        "Recomendaciones", nvl(h.getRecomendaciones()));
            }
            PdfUtil.seccion(doc, "Servicios prestados y medicamentos formulados");
            PdfPTable t = PdfUtil.tabla(4f, 1f, 1.6f, 1.2f, 1.5f, 1.6f);
            for (String x : new String[]{"Concepto", "Cant.", "Valor unitario", "Impuesto", "Valor impuesto", "Total"}) {
                t.addCell(PdfUtil.th(x));
            }
            BigDecimal subtotal = BigDecimal.ZERO;
            BigDecimal impuestos = BigDecimal.ZERO;
            if (servicios.isEmpty() && c.getTarifa() != null) {
                BigDecimal[] r = filaPrefactura(t, c.getTarifa().getNombre(), 1, c.getTarifa().getValor(), c.getTarifa().getImpuesto());
                subtotal = subtotal.add(r[0]);
                impuestos = impuestos.add(r[1]);
            }
            for (AtencionServicio s : servicios) {
                Tarifa tr = s.getTarifa();
                BigDecimal[] r = filaPrefactura(t, tr.getNombre() + " (" + tr.getTipoServicio().toLowerCase() + ")",
                        s.getCantidad(), tr.getValor(), tr.getImpuesto());
                subtotal = subtotal.add(r[0]);
                impuestos = impuestos.add(r[1]);
            }
            for (FormulaMedica f : formulas) {
                for (FormulaMedicaDetalle d : f.getDetalles()) {
                    BigDecimal[] r = filaPrefactura(t, d.getMedicamento().getNombre() + " · " + numero(f),
                            d.getCantidadPrescrita(), d.getMedicamento().getPrecioVenta(), d.getMedicamento().getImpuesto());
                    subtotal = subtotal.add(r[0]);
                    impuestos = impuestos.add(r[1]);
                }
            }
            doc.add(t);
            totales(doc, new String[]{"Subtotal", "Impuestos", "TOTAL ESTIMADO"},
                    new BigDecimal[]{subtotal, impuestos, subtotal.add(impuestos)});
            Paragraph nota = new Paragraph("Los medicamentos se cobran en la factura según lo efectivamente dispensado. "
                    + "Valores calculados con las tarifas vigentes al " + Formato.fechaHora(LocalDateTime.now()) + ".",
                    PdfUtil.fuente(8, Font.ITALIC, PdfUtil.GRIS_OSCURO));
            nota.setSpacingBefore(10);
            doc.add(nota);
            return pdf.cerrar();
        } catch (Exception ex) {
            throw new IllegalStateException("No fue posible generar la prefactura.", ex);
        }
    }

    // ------------------------------------------------------------------ factura

    @Override
    @Transactional(readOnly = true)
    public byte[] factura(Long facturaId) {
        Validar.idValido(facturaId, "facturaId");
        Factura f = facturaRepository.findById(facturaId).orElseThrow(() -> new NotFoundException("La factura no existe."));
        try {
            PdfUtil.Pdf pdf = PdfUtil.nuevo(false, "Factura " + f.getNumero());
            Document doc = pdf.doc();
            PdfUtil.encabezado(doc, clinica, "FACTURA DE VENTA", f.getNumero(),
                    "Fecha de generación: " + Formato.fechaHora(f.getFechaGeneracion()));
            if (Constantes.FAC_ANULADA.equals(f.getEstado())) {
                Paragraph anulada = new Paragraph("FACTURA ANULADA - " + nvl(f.getMotivoAnulacion()),
                        PdfUtil.fuente(12, Font.BOLD, new java.awt.Color(198, 40, 40)));
                anulada.setAlignment(Element.ALIGN_CENTER);
                doc.add(anulada);
            }
            bloquePaciente(doc, f.getCliente(), f.getMascota(), f.getMedico());
            PdfUtil.datos(doc, 2, "Especialidad", f.getEspecializacion(), "Cita / atención",
                    "#" + f.getCita().getId() + " del " + Formato.fechaHora(f.getCita().getFechaHora()));
            PdfUtil.seccion(doc, "Detalle");
            PdfPTable t = PdfUtil.tabla(1.1f, 3.6f, 0.8f, 1.5f, 1.3f, 1.5f, 1.2f, 1.4f, 1.6f);
            for (String x : new String[]{"Tipo", "Descripción", "Cant.", "Precio unit.", "Descuento", "Subtotal",
                    "Impuesto", "Valor imp.", "Total"}) {
                t.addCell(PdfUtil.th(x));
            }
            for (FacturaDetalle d : f.getDetalles()) {
                t.addCell(PdfUtil.td(Constantes.ITEM_SERVICIO.equals(d.getTipoItem()) ? "Servicio" : "Producto"));
                t.addCell(PdfUtil.td(d.getDescripcion()));
                t.addCell(PdfUtil.td(String.valueOf(d.getCantidad()), Element.ALIGN_CENTER, false));
                t.addCell(PdfUtil.tdDerecha(Formato.moneda(d.getPrecioUnitario())));
                t.addCell(PdfUtil.tdDerecha(Formato.moneda(d.getValorDescuento())));
                t.addCell(PdfUtil.tdDerecha(Formato.moneda(d.getSubtotal())));
                t.addCell(PdfUtil.td(d.getImpuestoCodigo() + " " + Formato.numero(d.getImpuestoPorcentaje()) + "%",
                        Element.ALIGN_CENTER, false));
                t.addCell(PdfUtil.tdDerecha(Formato.moneda(d.getValorImpuesto())));
                t.addCell(PdfUtil.tdDerecha(Formato.moneda(d.getTotal())));
            }
            doc.add(t);
            BigDecimal iva = f.getDetalles().stream().filter(d -> d.getImpuestoCodigo().startsWith("IVA"))
                    .map(FacturaDetalle::getValorImpuesto).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal otros = f.getTotalImpuestos().subtract(iva);
            totales(doc, new String[]{"Subtotal", "Descuentos", "IVA", "Otros impuestos", "TOTAL A PAGAR",
                            "Pagado", "Saldo"},
                    new BigDecimal[]{f.getSubtotal(), f.getTotalDescuento().negate(), iva, otros, f.getTotal(),
                            f.getTotalPagado(), f.getSaldo()});
            PdfUtil.seccion(doc, "Estado de pago: " + f.getEstado().replace('_', ' '));
            if (!f.getPagos().isEmpty()) {
                PdfPTable p = PdfUtil.tabla(2f, 2f, 2f, 1.6f, 1.4f);
                for (String x : new String[]{"Fecha", "Método", "Referencia", "Valor", "Estado"}) {
                    p.addCell(PdfUtil.th(x));
                }
                for (Pago pg : f.getPagos()) {
                    p.addCell(PdfUtil.td(Formato.fechaHora(pg.getFechaPago())));
                    p.addCell(PdfUtil.td(pg.getMetodoPago().replace('_', ' ')));
                    p.addCell(PdfUtil.td(nvl(pg.getReferencia())));
                    p.addCell(PdfUtil.tdDerecha(Formato.moneda(pg.getValor())));
                    p.addCell(PdfUtil.td(Boolean.TRUE.equals(pg.getAnulado()) ? "Anulado" : "Aplicado", Element.ALIGN_CENTER, false));
                }
                doc.add(p);
            }
            if (f.getUsuarioAutorizaDescuento() != null) {
                PdfUtil.parrafo(doc, "Descuento autorizado por: " + f.getUsuarioAutorizaDescuento().getNombreCompleto());
            }
            PdfUtil.parrafo(doc, "Elaborada por: " + f.getUsuario().getNombreCompleto()
                    + (f.getObservaciones() == null ? "" : "  ·  Observaciones: " + f.getObservaciones()));
            return pdf.cerrar();
        } catch (Exception ex) {
            throw new IllegalStateException("No fue posible generar el PDF de la factura.", ex);
        }
    }

    // ------------------------------------------------------------------ comprobante de despacho

    @Override
    @Transactional(readOnly = true)
    public byte[] comprobanteDespacho(Long despachoId) {
        Validar.idValido(despachoId, "despachoId");
        Despacho d = despachoRepository.findById(despachoId)
                .orElseThrow(() -> new NotFoundException("El despacho no existe."));
        FormulaMedica f = d.getFormula();
        try {
            PdfUtil.Pdf pdf = PdfUtil.nuevo(false, "Comprobante " + d.getNumero());
            Document doc = pdf.doc();
            PdfUtil.encabezado(doc, clinica, "COMPROBANTE DE DESPACHO", d.getNumero(),
                    "Entrega: " + Formato.fechaHora(d.getFechaDespacho()));
            if (Boolean.TRUE.equals(d.getRevertido())) {
                Paragraph rev = new Paragraph("DESPACHO REVERTIDO el " + Formato.fechaHora(d.getFechaReversion()) + ": "
                        + nvl(d.getMotivoReversion()), PdfUtil.fuente(10, Font.BOLD, new java.awt.Color(198, 40, 40)));
                doc.add(rev);
            }
            bloquePaciente(doc, f.getCita().getCliente(), f.getMascota(), f.getMedico());
            PdfUtil.datos(doc, 2, "Fórmula", numero(f) + " del " + Formato.fecha(f.getFechaEmision()),
                    "Responsable despacho", d.getUsuario().getNombreCompleto(),
                    "Estado de la fórmula", d.getEstadoResultante().replace('_', ' '),
                    "Observaciones", nvl(d.getObservaciones()));
            PdfUtil.seccion(doc, "Medicamentos entregados");
            PdfPTable t = PdfUtil.tabla(1.3f, 3.4f, 1.6f, 1.5f, 1.1f, 2.6f);
            for (String x : new String[]{"Código", "Medicamento", "Lote", "Vence", "Cantidad", "Dosis / frecuencia"}) {
                t.addCell(PdfUtil.th(x));
            }
            for (DespachoDetalle dd : d.getDetalles()) {
                FormulaMedicaDetalle fd = dd.getFormulaDetalle();
                t.addCell(PdfUtil.td(dd.getMedicamento().getCodigo()));
                t.addCell(PdfUtil.td(dd.getMedicamento().getNombre()));
                t.addCell(PdfUtil.td(dd.getLote().getNumeroLote()));
                t.addCell(PdfUtil.td(Formato.fecha(dd.getLote().getFechaVencimiento()), Element.ALIGN_CENTER, false));
                t.addCell(PdfUtil.td(dd.getCantidad() + " " + dd.getMedicamento().getUnidadMedida().toLowerCase(),
                        Element.ALIGN_CENTER, false));
                t.addCell(PdfUtil.td(fd.getDosis() + " cada " + fd.getFrecuenciaHoras() + " h por " + fd.getDuracionDias() + " día(s)"));
            }
            doc.add(t);
            PdfUtil.seccion(doc, "Saldo de la fórmula");
            PdfPTable s = PdfUtil.tabla(3.5f, 1.3f, 1.3f, 1.3f);
            for (String x : new String[]{"Medicamento", "Prescrito", "Entregado", "Pendiente"}) {
                s.addCell(PdfUtil.th(x));
            }
            for (FormulaMedicaDetalle fd : f.getDetalles()) {
                s.addCell(PdfUtil.td(fd.getMedicamento().getNombre()));
                s.addCell(PdfUtil.td(String.valueOf(fd.getCantidadPrescrita()), Element.ALIGN_CENTER, false));
                s.addCell(PdfUtil.td(String.valueOf(fd.getCantidadDespachada()), Element.ALIGN_CENTER, false));
                s.addCell(PdfUtil.td(String.valueOf(fd.getCantidadPendiente()), Element.ALIGN_CENTER, fd.getCantidadPendiente() > 0));
            }
            doc.add(s);
            PdfPTable firmas = new PdfPTable(2);
            firmas.setWidthPercentage(100);
            firmas.setSpacingBefore(40);
            PdfPCell a = new PdfPCell(new Paragraph("______________________________\nEntrega: " + d.getUsuario().getNombreCompleto(),
                    PdfUtil.fuente(9, Font.NORMAL)));
            a.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            Cliente cl = f.getCita().getCliente();
            PdfPCell b = new PdfPCell(new Paragraph("______________________________\nRecibe: " + cl.getNombres() + " "
                    + cl.getApellidos() + " (" + cl.getTipoDocumento() + " " + cl.getNumeroDocumento() + ")",
                    PdfUtil.fuente(9, Font.NORMAL)));
            b.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            firmas.addCell(a);
            firmas.addCell(b);
            doc.add(firmas);
            return pdf.cerrar();
        } catch (Exception ex) {
            throw new IllegalStateException("No fue posible generar el comprobante de despacho.", ex);
        }
    }

    // ------------------------------------------------------------------ apoyo

    private void bloquePaciente(Document doc, Cliente c, Mascota m, Medico med) throws Exception {
        PdfUtil.seccion(doc, "Propietario y paciente");
        PdfUtil.datos(doc, 2,
                "Propietario", c.getNombres() + " " + c.getApellidos(),
                "Documento", c.getTipoDocumento() + " " + c.getNumeroDocumento(),
                "Teléfono", nvl(c.getTelefono()),
                "Dirección", nvl(c.getDireccion()),
                "Mascota", m.getNombreMascota(),
                "Especie / raza", m.getRaza().getEspecie() + " / " + m.getRaza().getNombre(),
                "Edad / sexo", (m.getEdad() == null ? "-" : m.getEdad() + " año(s)") + " / " + nvl(m.getSexo()),
                "Peso", m.getPesoKg() == null ? "-" : Formato.numero(m.getPesoKg()) + " kg",
                "Veterinario", med.nombreCompleto(),
                "Especialidad", med.getEspecializacion().getNombre());
    }

    private BigDecimal[] filaPrefactura(PdfPTable t, String concepto, int cantidad, BigDecimal precio, Impuesto imp) {
        BigDecimal base = precio.multiply(BigDecimal.valueOf(cantidad));
        BigDecimal valorImp = base.multiply(imp.getPorcentaje()).divide(CIEN, 0, RoundingMode.HALF_UP);
        t.addCell(PdfUtil.td(concepto));
        t.addCell(PdfUtil.td(String.valueOf(cantidad), Element.ALIGN_CENTER, false));
        t.addCell(PdfUtil.tdDerecha(Formato.moneda(precio)));
        t.addCell(PdfUtil.td(imp.getCodigo(), Element.ALIGN_CENTER, false));
        t.addCell(PdfUtil.tdDerecha(Formato.moneda(valorImp)));
        t.addCell(PdfUtil.tdDerecha(Formato.moneda(base.add(valorImp))));
        return new BigDecimal[]{base, valorImp};
    }

    private void totales(Document doc, String[] etiquetas, BigDecimal[] valores) throws Exception {
        PdfPTable t = new PdfPTable(new float[]{5f, 2f, 1.8f});
        t.setWidthPercentage(100);
        t.setSpacingBefore(6);
        for (int i = 0; i < etiquetas.length; i++) {
            boolean fuerte = etiquetas[i].startsWith("TOTAL");
            PdfPCell vacia = new PdfPCell(new Paragraph(""));
            vacia.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            t.addCell(vacia);
            t.addCell(PdfUtil.td(etiquetas[i], Element.ALIGN_RIGHT, fuerte));
            t.addCell(PdfUtil.td(Formato.moneda(valores[i]), Element.ALIGN_RIGHT, fuerte));
        }
        doc.add(t);
    }

    /** El MEDICO sólo descarga documentos de sus propias atenciones. */
    private void verificarMedico(Medico medico) {
        UsuarioActual u = ContextoUsuario.obtener();
        if (Roles.MEDICO.equals(u.perfilCodigo()) && !medico.getId().equals(u.medicoId())) {
            throw new ForbiddenException("El documento pertenece a otro veterinario.");
        }
    }

    private static String numero(FormulaMedica f) {
        return f.getNumero() == null ? "Borrador #" + f.getId() : f.getNumero();
    }

    private static String nvl(String s) {
        return s == null || s.isBlank() ? "-" : s;
    }
}
