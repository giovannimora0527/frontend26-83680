package com.uniminuto.clinica.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import com.uniminuto.clinica.models.CargaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

/**
 * Servicios REST de la carga masiva de inventario (solo administrador).
 */
@Tag(name = "11. Carga masiva de inventario", description = "Plantilla, validación, vista previa, importación y log de cargue")
@RequestMapping("/medicamento/carga")
public interface CargaInventarioApi {

    /**
     * Plantilla de carga en Excel.
     *
     * @return archivo .xlsx.
     */
    @GetMapping(value = "/plantilla",
            produces = {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/json"})
    ResponseEntity<byte[]> plantilla();

    /**
     * Valida un archivo .xlsx o .csv sin importarlo y devuelve la vista previa por fila.
     *
     * @param archivo archivo (máximo 5 MB y 5000 filas).
     * @return resumen y filas con su estado (201).
     */
    @PostMapping(value = "/validar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = {"application/json"})
    ResponseEntity<CargaRs> validar(@RequestPart("archivo") MultipartFile archivo);

    /**
     * Importa las filas válidas de una carga (cada fila en su propia transacción).
     *
     * @param cargaId carga validada.
     * @return resultado por fila.
     */
    @PutMapping(value = "/{cargaId}/confirmar", produces = {"application/json"})
    ResponseEntity<CargaRs> confirmar(@PathVariable Long cargaId);

    /**
     * Descarta una carga validada.
     *
     * @param cargaId carga.
     * @return mensaje de éxito.
     */
    @PutMapping(value = "/{cargaId}/descartar", produces = {"application/json"})
    ResponseEntity<MiRespuestaRS> descartar(@PathVariable Long cargaId);

    /**
     * Log de cargas.
     *
     * @param page página.
     * @param size tamaño.
     * @return cargas.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<PaginaRs<CargaRs>> listar(@RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "10") int size);

    /**
     * Detalle de una carga con sus filas.
     *
     * @param cargaId carga.
     * @return carga.
     */
    @GetMapping(value = "/{cargaId}", produces = {"application/json"})
    ResponseEntity<CargaRs> consultar(@PathVariable Long cargaId);

    /**
     * Informe de errores en Excel (fila y motivo).
     *
     * @param cargaId carga.
     * @return archivo .xlsx.
     */
    @GetMapping(value = "/{cargaId}/errores",
            produces = {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/json"})
    ResponseEntity<byte[]> informeErrores(@PathVariable Long cargaId);
}
