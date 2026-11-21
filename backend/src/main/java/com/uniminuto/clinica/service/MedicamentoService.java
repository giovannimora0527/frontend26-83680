package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.LoteMedicamento;
import com.uniminuto.clinica.entity.MovimientoInventario;
import com.uniminuto.clinica.models.AlertasInventarioRs;
import com.uniminuto.clinica.models.LoteRq;
import com.uniminuto.clinica.models.MedicamentoRq;
import com.uniminuto.clinica.models.MedicamentoRs;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.time.LocalDate;
import java.util.List;

public interface MedicamentoService {

    /**
     * @param filtro TODOS, DISPONIBLES, AGOTADOS, BAJO_STOCK, PROXIMOS_VENCER, VENCIDOS, INACTIVOS
     */
    List<MedicamentoRs> listar(String filtro, String texto);

    MedicamentoRs consultar(Long id);

    MiRespuestaRS crear(MedicamentoRq rq);

    MiRespuestaRS actualizar(MedicamentoRq rq);

    MiRespuestaRS cambiarEstado(Long id, boolean activo);

    MiRespuestaRS registrarLote(LoteRq rq);

    List<LoteMedicamento> lotes(Long medicamentoId, boolean soloConExistencia);

    List<MovimientoInventario> movimientos(Long medicamentoId, String tipo, LocalDate desde, LocalDate hasta);

    AlertasInventarioRs alertas();
}
