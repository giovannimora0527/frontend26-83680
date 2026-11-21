package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Respuesta estándar de las operaciones de escritura.
 */
@Data
public class MiRespuestaRS {

    private int status;
    private String message;
    /** Id del registro creado o afectado (opcional). */
    private Long id;

    public static MiRespuestaRS ok(String mensaje) {
        return crear(200, mensaje, null);
    }

    public static MiRespuestaRS ok(String mensaje, Number id) {
        return crear(200, mensaje, id);
    }

    public static MiRespuestaRS creado(String mensaje, Number id) {
        return crear(201, mensaje, id);
    }

    private static MiRespuestaRS crear(int status, String mensaje, Number id) {
        MiRespuestaRS r = new MiRespuestaRS();
        r.setStatus(status);
        r.setMessage(mensaje);
        r.setId(id == null ? null : id.longValue());
        return r;
    }
}
