package com.uniminuto.clinica.service;

/**
 * Generación de documentos PDF del proceso de atención.
 */
public interface DocumentoService {

    byte[] formula(Long formulaId);

    /** Prefactura al finalizar la atención: servicios prestados + medicamentos formulados. */
    byte[] prefactura(Long citaId);

    byte[] factura(Long facturaId);

    byte[] comprobanteDespacho(Long despachoId);
}
