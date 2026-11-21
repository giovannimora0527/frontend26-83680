package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.ReporteApi;
import com.uniminuto.clinica.models.ReporteCatalogoRs;
import com.uniminuto.clinica.models.ReporteData;
import com.uniminuto.clinica.models.ReporteFiltro;
import com.uniminuto.clinica.security.RequiereRol;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.ReporteService;
import com.uniminuto.clinica.utils.Descarga;
import com.uniminuto.clinica.utils.ReporteRenderer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiereRol(Roles.ADMIN)
public class ReporteApiController implements ReporteApi {

    @Autowired
    private ReporteService reporteService;

    @Autowired
    private ReporteRenderer renderer;

    @Override
    public ResponseEntity<List<ReporteCatalogoRs>> catalogo() {
        return ResponseEntity.ok(reporteService.catalogo());
    }

    @Override
    public ResponseEntity<ReporteData> generar(String codigo, LocalDate fechaInicial, LocalDate fechaFinal,
                                               String agrupacion, String estado, Long medicoId, Long medicamentoId,
                                               String tipo, Integer dias) {
        return ResponseEntity.ok(reporteService.generar(codigo,
                filtro(fechaInicial, fechaFinal, agrupacion, estado, medicoId, medicamentoId, tipo, dias)));
    }

    @Override
    public ResponseEntity<byte[]> pdf(String codigo, LocalDate fechaInicial, LocalDate fechaFinal, String agrupacion,
                                      String estado, Long medicoId, Long medicamentoId, String tipo, Integer dias) {
        ReporteData r = reporteService.generar(codigo,
                filtro(fechaInicial, fechaFinal, agrupacion, estado, medicoId, medicamentoId, tipo, dias));
        return Descarga.pdf(renderer.pdf(r), "reporte_" + codigo + "_" + LocalDate.now() + ".pdf");
    }

    @Override
    public ResponseEntity<byte[]> excel(String codigo, LocalDate fechaInicial, LocalDate fechaFinal, String agrupacion,
                                        String estado, Long medicoId, Long medicamentoId, String tipo, Integer dias) {
        ReporteData r = reporteService.generar(codigo,
                filtro(fechaInicial, fechaFinal, agrupacion, estado, medicoId, medicamentoId, tipo, dias));
        return Descarga.excel(renderer.excel(r), "reporte_" + codigo + "_" + LocalDate.now() + ".xlsx");
    }

    private static ReporteFiltro filtro(LocalDate fechaInicial, LocalDate fechaFinal, String agrupacion, String estado,
                                        Long medicoId, Long medicamentoId, String tipo, Integer dias) {
        ReporteFiltro f = new ReporteFiltro();
        f.setFechaInicial(fechaInicial);
        f.setFechaFinal(fechaFinal);
        f.setAgrupacion(agrupacion);
        f.setEstado(estado);
        f.setMedicoId(medicoId);
        f.setMedicamentoId(medicamentoId);
        f.setTipo(tipo);
        f.setDias(dias);
        return f;
    }
}
