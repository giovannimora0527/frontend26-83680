package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.ServicioRq;
import com.uniminuto.clinica.models.ServicioRs;
import com.uniminuto.clinica.models.TarifaLogRs;

import java.util.List;

/**
 * Administración de servicios y tarifas.
 */
public interface ServicioService {

    /**
     * Lista los servicios.
     *
     * @param soloActivos si solo se devuelven los activos.
     * @return servicios ordenados por tipo y nombre.
     */
    List<ServicioRs> listar(boolean soloActivos);

    /**
     * Consulta un servicio.
     *
     * @param id identificador.
     * @return servicio.
     */
    ServicioRs consultar(Long id);

    /**
     * Registra un servicio.
     *
     * @param rq datos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS guardar(ServicioRq rq);

    /**
     * Modifica un servicio y su tarifa (queda en el log).
     *
     * @param id identificador.
     * @param rq datos nuevos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizar(Long id, ServicioRq rq);

    /**
     * Activa o inactiva un servicio.
     *
     * @param id     identificador.
     * @param activo estado nuevo.
     * @return mensaje de éxito.
     */
    MiRespuestaRS cambiarActivo(Long id, boolean activo);

    /**
     * Log de cambios de la tarifa de un servicio.
     *
     * @param id identificador.
     * @return cambios, del más reciente al más antiguo.
     */
    List<TarifaLogRs> historial(Long id);
}
