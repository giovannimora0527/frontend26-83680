package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.CargaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import org.springframework.web.multipart.MultipartFile;

/**
 * Carga masiva de medicamentos y productos desde Excel (.xlsx) o CSV.
 */
public interface CargaInventarioService {

    /**
     * Plantilla de carga en Excel con los encabezados y dos filas de ejemplo.
     *
     * @return archivo .xlsx.
     */
    byte[] plantilla();

    /**
     * Lee y valida un archivo sin importarlo: guarda la carga y el resultado de cada fila.
     *
     * @param archivo archivo .xlsx o .csv.
     * @return resumen y filas con su estado (vista previa).
     */
    CargaRs validar(MultipartFile archivo);

    /**
     * Importa las filas válidas de una carga, cada una en su propia transacción.
     *
     * @param cargaId carga validada.
     * @return resultado de la importación.
     */
    CargaRs confirmar(Long cargaId);

    /**
     * Descarta una carga validada sin importarla.
     *
     * @param cargaId carga.
     * @return mensaje de éxito.
     */
    MiRespuestaRS descartar(Long cargaId);

    /**
     * Log de cargas (de la más reciente a la más antigua).
     *
     * @param page página.
     * @param size tamaño.
     * @return cargas sin el detalle de filas.
     */
    PaginaRs<CargaRs> listar(int page, int size);

    /**
     * Consulta una carga con sus filas.
     *
     * @param cargaId carga.
     * @return carga con filas.
     */
    CargaRs consultar(Long cargaId);

    /**
     * Informe de errores de una carga en Excel (fila y motivo del rechazo).
     *
     * @param cargaId carga.
     * @return archivo .xlsx.
     */
    byte[] informeErrores(Long cargaId);
}
