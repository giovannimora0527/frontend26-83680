package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.ReporteDefRs;
import com.uniminuto.clinica.models.ReporteRs;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.util.List;

/**
 * Servicios REST de reportes: catálogo según el perfil, vista previa y descarga en PDF o Excel.
 * Los financieros y de inventario son del administrador; los de gestión médica, también de recepción.
 */
@RequestMapping("/reporte")
public interface ReporteApi {

    /**
     * Reportes disponibles para el perfil de la sesión.
     *
     * @return catálogo.
     */
    @GetMapping(value = "/catalogo", produces = {"application/json"})
    ResponseEntity<List<ReporteDefRs>> catalogo();

    /**
     * Vista previa de un reporte.
     *
     * @param codigo            código del reporte.
     * @param desde             fecha inicial (yyyy-MM-dd; por defecto el primer día del mes).
     * @param hasta             fecha final (por defecto hoy).
     * @param agrupacion        DIA, MES o ANIO.
     * @param medicoId          veterinario.
     * @param especializacionId especialidad.
     * @param medicamentoId     producto.
     * @param estado            estado de factura o de cita (PENDIENTES agrupa las no finalizadas).
     * @param dias              días hacia adelante (próximos a vencer).
     * @return columnas, filas y totales.
     */
    @GetMapping(value = "/{codigo}", produces = {"application/json"})
    ResponseEntity<ReporteRs> generar(@PathVariable String codigo,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                                      @RequestParam(required = false) String agrupacion,
                                      @RequestParam(required = false) Long medicoId,
                                      @RequestParam(required = false) Long especializacionId,
                                      @RequestParam(required = false) Long medicamentoId,
                                      @RequestParam(required = false) String estado,
                                      @RequestParam(required = false) Integer dias);

    /**
     * Reporte en PDF (mismos filtros que la vista previa).
     *
     * @return documento PDF.
     */
    @GetMapping(value = "/{codigo}/pdf", produces = {"application/pdf", "application/json"})
    ResponseEntity<byte[]> pdf(@PathVariable String codigo,
                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                               @RequestParam(required = false) String agrupacion,
                               @RequestParam(required = false) Long medicoId,
                               @RequestParam(required = false) Long especializacionId,
                               @RequestParam(required = false) Long medicamentoId,
                               @RequestParam(required = false) String estado,
                               @RequestParam(required = false) Integer dias);

    /**
     * Reporte en Excel (mismos filtros que la vista previa).
     *
     * @return archivo .xlsx.
     */
    @GetMapping(value = "/{codigo}/excel",
            produces = {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/json"})
    ResponseEntity<byte[]> excel(@PathVariable String codigo,
                                 @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                 @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                                 @RequestParam(required = false) String agrupacion,
                                 @RequestParam(required = false) Long medicoId,
                                 @RequestParam(required = false) Long especializacionId,
                                 @RequestParam(required = false) Long medicamentoId,
                                 @RequestParam(required = false) String estado,
                                 @RequestParam(required = false) Integer dias);
}
