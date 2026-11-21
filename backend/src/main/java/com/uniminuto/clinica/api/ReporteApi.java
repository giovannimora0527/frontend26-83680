package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.ReporteCatalogoRs;
import com.uniminuto.clinica.models.ReporteData;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "15. Reportes administrativos y contables", description = "Vista previa JSON y descarga PDF / Excel (ADMIN)")
@RequestMapping("/reporte")
public interface ReporteApi {

    @Operation(summary = "Catálogo de reportes y filtros que admite cada uno")
    @GetMapping(value = "/catalogo", produces = "application/json")
    ResponseEntity<List<ReporteCatalogoRs>> catalogo();

    @Operation(summary = "Vista previa del reporte (mismo contenido que el PDF/Excel)")
    @GetMapping(value = "/{codigo}", produces = "application/json")
    ResponseEntity<ReporteData> generar(@PathVariable("codigo") String codigo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFinal,
            @RequestParam(required = false) String agrupacion,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) Long medicamentoId,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Integer dias);

    @Operation(summary = "Descarga el reporte en PDF")
    @GetMapping(value = "/{codigo}/pdf")
    ResponseEntity<byte[]> pdf(@PathVariable("codigo") String codigo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFinal,
            @RequestParam(required = false) String agrupacion,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) Long medicamentoId,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Integer dias);

    @Operation(summary = "Descarga el reporte en Excel (.xlsx)")
    @GetMapping(value = "/{codigo}/excel")
    ResponseEntity<byte[]> excel(@PathVariable("codigo") String codigo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFinal,
            @RequestParam(required = false) String agrupacion,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) Long medicamentoId,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Integer dias);
}
