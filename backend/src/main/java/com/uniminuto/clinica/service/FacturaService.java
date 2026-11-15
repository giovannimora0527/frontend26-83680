package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.FacturaFiltroRq;
import com.uniminuto.clinica.models.FacturaRq;
import com.uniminuto.clinica.models.FacturaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MotivoRq;
import com.uniminuto.clinica.models.PagoRq;
import com.uniminuto.clinica.models.PaginaRs;

import java.util.List;

/**
 * Facturación de las atenciones y registro de pagos.
 */
public interface FacturaService {

    /**
     * Atenciones finalizadas que aún no tienen factura (vista previa de cada una).
     *
     * @return atenciones por facturar.
     */
    List<FacturaRs> porFacturar();

    /**
     * Vista previa de la factura de una atención, sin guardarla.
     *
     * @param historiaId atención.
     * @return factura calculada.
     */
    FacturaRs vistaPrevia(Long historiaId);

    /**
     * Genera la factura de una atención (una sola por atención).
     *
     * @param rq atención y descuento.
     * @return factura generada.
     */
    FacturaRs generar(FacturaRq rq);

    /**
     * Lista facturas con filtros (historial por propietario o mascota).
     *
     * @param filtro filtros.
     * @return página de facturas (sin líneas).
     */
    PaginaRs<FacturaRs> listar(FacturaFiltroRq filtro);

    /**
     * Consulta una factura con líneas y pagos.
     *
     * @param facturaId factura.
     * @return factura.
     */
    FacturaRs consultar(Long facturaId);

    /**
     * Registra un pago.
     *
     * @param facturaId factura.
     * @param rq        pago.
     * @return mensaje de éxito.
     */
    MiRespuestaRS registrarPago(Long facturaId, PagoRq rq);

    /**
     * Anula una factura sin pagos (solo administrador, con motivo).
     *
     * @param facturaId factura.
     * @param rq        motivo.
     * @return mensaje de éxito.
     */
    MiRespuestaRS anular(Long facturaId, MotivoRq rq);

    /**
     * Factura en PDF.
     *
     * @param facturaId factura.
     * @return contenido del PDF.
     */
    byte[] generarPdf(Long facturaId);
}
