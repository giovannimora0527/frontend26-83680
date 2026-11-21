package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.CargaMasiva;
import com.uniminuto.clinica.models.CargaMasivaRs;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CargaMasivaService {

    byte[] plantilla();

    /** Lee, valida y guarda la vista previa (no afecta el inventario). */
    CargaMasivaRs previsualizar(MultipartFile archivo);

    /** Importa sólo los registros válidos; cada fila en su propia transacción. */
    CargaMasivaRs confirmar(Long cargaId);

    CargaMasivaRs cancelar(Long cargaId);

    CargaMasivaRs detalle(Long cargaId);

    List<CargaMasiva> historial();

    byte[] reporteErrores(Long cargaId);
}
