package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.CargaInventarioApi;
import com.uniminuto.clinica.models.CargaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.service.CargaInventarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller de la carga masiva de inventario.
 */
@RestController
public class CargaInventarioApiController implements CargaInventarioApi {

    /** Tipo de contenido de Excel. */
    private static final MediaType XLSX =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    /** Servicio de la carga masiva. */
    @Autowired
    private CargaInventarioService cargaService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<byte[]> plantilla() {
        return excel(cargaService.plantilla(), "plantilla-carga-inventario.xlsx");
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<CargaRs> validar(MultipartFile archivo) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cargaService.validar(archivo));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<CargaRs> confirmar(Long cargaId) {
        return ResponseEntity.ok(cargaService.confirmar(cargaId));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> descartar(Long cargaId) {
        return ResponseEntity.ok(cargaService.descartar(cargaId));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<PaginaRs<CargaRs>> listar(int page, int size) {
        return ResponseEntity.ok(cargaService.listar(page, size));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<CargaRs> consultar(Long cargaId) {
        return ResponseEntity.ok(cargaService.consultar(cargaId));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<byte[]> informeErrores(Long cargaId) {
        return excel(cargaService.informeErrores(cargaId), "errores-carga-" + cargaId + ".xlsx");
    }

    private static ResponseEntity<byte[]> excel(byte[] contenido, String nombre) {
        return ResponseEntity.ok().contentType(XLSX)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(nombre).build().toString())
                .body(contenido);
    }
}
