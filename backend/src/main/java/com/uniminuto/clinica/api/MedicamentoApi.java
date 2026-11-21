package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.CargaMasiva;
import com.uniminuto.clinica.entity.LoteMedicamento;
import com.uniminuto.clinica.entity.MovimientoInventario;
import com.uniminuto.clinica.models.AlertasInventarioRs;
import com.uniminuto.clinica.models.CargaMasivaRs;
import com.uniminuto.clinica.models.LoteRq;
import com.uniminuto.clinica.models.MedicamentoRq;
import com.uniminuto.clinica.models.MedicamentoRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "09. Inventario de medicamentos y productos", description = "Productos, lotes, kardex, alertas y carga masiva")
@RequestMapping("/medicamento")
public interface MedicamentoApi {

    @Operation(summary = "Lista el inventario. filtro: TODOS, DISPONIBLES, AGOTADOS, BAJO_STOCK, PROXIMOS_VENCER, VENCIDOS, INACTIVOS")
    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<MedicamentoRs>> listar(@RequestParam(defaultValue = "TODOS") String filtro,
                                               @RequestParam(required = false) String texto);

    @Operation(summary = "Consulta un producto con sus indicadores de inventario")
    @GetMapping(value = "/consultar", produces = "application/json")
    ResponseEntity<MedicamentoRs> consultar(@RequestParam Long medicamentoId);

    @Operation(summary = "Alertas: agotados, bajo stock, próximos a vencer, con lotes vencidos, pedidos pendientes")
    @GetMapping(value = "/alertas", produces = "application/json")
    ResponseEntity<AlertasInventarioRs> alertas();

    @Operation(summary = "Registra un producto (opcional lote inicial) - ADMIN")
    @PostMapping(value = "/crear", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> crear(@RequestBody MedicamentoRq rq);

    @Operation(summary = "Edita datos y precios de un producto (no las cantidades) - ADMIN")
    @PutMapping(value = "/actualizar", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> actualizar(@RequestBody MedicamentoRq rq);

    @Operation(summary = "Activa o inactiva un producto - ADMIN")
    @PatchMapping(value = "/cambiar-estado", produces = "application/json")
    ResponseEntity<MiRespuestaRS> cambiarEstado(@RequestParam Long medicamentoId, @RequestParam boolean activo);

    @Operation(summary = "Lotes del producto (soloConExistencia=true ordena FEFO)")
    @GetMapping(value = "/lotes", produces = "application/json")
    ResponseEntity<List<LoteMedicamento>> lotes(@RequestParam Long medicamentoId,
                                                @RequestParam(defaultValue = "false") boolean soloConExistencia);

    @Operation(summary = "Ingresa un lote (entrada por compra) - ADMIN")
    @PostMapping(value = "/lotes", produces = "application/json", consumes = "application/json")
    ResponseEntity<MiRespuestaRS> registrarLote(@RequestBody LoteRq rq);

    @Operation(summary = "Historial de entradas y salidas (kardex). medicamentoId y tipo opcionales")
    @GetMapping(value = "/movimientos", produces = "application/json")
    ResponseEntity<List<MovimientoInventario>> movimientos(
            @RequestParam(required = false) Long medicamentoId,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta);

    @Operation(summary = "Descarga la plantilla Excel de carga masiva - ADMIN")
    @GetMapping(value = "/carga-masiva/plantilla")
    ResponseEntity<byte[]> plantilla();

    @Operation(summary = "Sube un .xlsx/.csv, valida y devuelve la vista previa (no afecta inventario) - ADMIN")
    @PostMapping(value = "/carga-masiva/previsualizar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = "application/json")
    ResponseEntity<CargaMasivaRs> previsualizar(@RequestParam("archivo") MultipartFile archivo);

    @Operation(summary = "Confirma la importación de los registros válidos - ADMIN")
    @PostMapping(value = "/carga-masiva/confirmar", produces = "application/json")
    ResponseEntity<CargaMasivaRs> confirmar(@RequestParam Long cargaId);

    @Operation(summary = "Cancela una carga en vista previa - ADMIN")
    @PostMapping(value = "/carga-masiva/cancelar", produces = "application/json")
    ResponseEntity<CargaMasivaRs> cancelar(@RequestParam Long cargaId);

    @Operation(summary = "Detalle (filas) de una carga - ADMIN")
    @GetMapping(value = "/carga-masiva/detalle", produces = "application/json")
    ResponseEntity<CargaMasivaRs> detalle(@RequestParam Long cargaId);

    @Operation(summary = "Log de cargues: fecha, usuario, totales - ADMIN")
    @GetMapping(value = "/carga-masiva/historial", produces = "application/json")
    ResponseEntity<List<CargaMasiva>> historial();

    @Operation(summary = "Informe de errores (Excel) con fila y motivo del rechazo - ADMIN")
    @GetMapping(value = "/carga-masiva/errores")
    ResponseEntity<byte[]> reporteErrores(@RequestParam Long cargaId);
}
