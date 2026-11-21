package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Factura;
import com.uniminuto.clinica.entity.FacturaHistorial;
import com.uniminuto.clinica.models.FacturaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PagoRq;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface FacturaService {

    List<Cita> citasPorFacturar();

    /** Calcula la factura de una cita sin guardarla (vista previa). */
    Factura calcular(Long citaId, BigDecimal porcentajeDescuento);

    MiRespuestaRS generar(FacturaRq rq);

    MiRespuestaRS agregarDispensados(Long facturaId);

    MiRespuestaRS registrarPago(PagoRq rq);

    MiRespuestaRS anularPago(Long pagoId, String motivo);

    MiRespuestaRS anular(Long facturaId, String motivo);

    List<Factura> listar(LocalDate fechaInicial, LocalDate fechaFinal, String estado, Long clienteId, Integer mascotaId);

    Factura consultar(Long facturaId);

    List<FacturaHistorial> historial(Long facturaId);
}
