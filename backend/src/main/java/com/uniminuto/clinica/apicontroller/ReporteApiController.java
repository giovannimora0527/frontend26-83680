package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.ReporteApi;
import com.uniminuto.clinica.models.ReporteDefRs;
import com.uniminuto.clinica.models.ReporteFiltroRq;
import com.uniminuto.clinica.models.ReporteRs;
import com.uniminuto.clinica.service.ReporteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller de reportes.
 */
@RestController
public class ReporteApiController implements ReporteApi {

    /** Servicio de reportes. */
    @Autowired
    private ReporteService reporteService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<ReporteDefRs>> catalogo() {
        return ResponseEntity.ok(reporteService.catalogo());
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<ReporteRs> generar(String codigo, LocalDate desde, LocalDate hasta, String agrupacion, Long medicoId,
                                             Long especializacionId, Long medicamentoId, String estado, Integer dias) {
        return ResponseEntity.ok(reporteService.generar(codigo,
                filtro(desde, hasta, agrupacion, medicoId, especializacionId, medicamentoId, estado, dias)));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<byte[]> pdf(String codigo, LocalDate desde, LocalDate hasta, String agrupacion, Long medicoId,
                                      Long especializacionId, Long medicamentoId, String estado, Integer dias) {
        byte[] contenido = reporteService.pdf(codigo,
                filtro(desde, hasta, agrupacion, medicoId, especializacionId, medicamentoId, estado, dias));
        return archivo(contenido, MediaType.APPLICATION_PDF, "reporte-" + codigo + "-" + LocalDate.now() + ".pdf");
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<byte[]> excel(String codigo, LocalDate desde, LocalDate hasta, String agrupacion, Long medicoId,
                                        Long especializacionId, Long medicamentoId, String estado, Integer dias) {
        byte[] contenido = reporteService.excel(codigo,
                filtro(desde, hasta, agrupacion, medicoId, especializacionId, medicamentoId, estado, dias));
        return archivo(contenido, MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
                "reporte-" + codigo + "-" + LocalDate.now() + ".xlsx");
    }

    private static ReporteFiltroRq filtro(LocalDate desde, LocalDate hasta, String agrupacion, Long medicoId,
                                          Long especializacionId, Long medicamentoId, String estado, Integer dias) {
        ReporteFiltroRq f = new ReporteFiltroRq();
        f.setDesde(desde);
        f.setHasta(hasta);
        f.setAgrupacion(agrupacion);
        f.setMedicoId(medicoId);
        f.setEspecializacionId(especializacionId);
        f.setMedicamentoId(medicamentoId);
        f.setEstado(estado);
        f.setDias(dias);
        return f;
    }

    private static ResponseEntity<byte[]> archivo(byte[] contenido, MediaType tipo, String nombre) {
        return ResponseEntity.ok()
                .contentType(tipo)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(nombre).build().toString())
                .body(contenido);
    }
}
