package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Respuesta estándar de las operaciones de escritura: código y mensaje para el usuario.
 */
@Data
public class MiRespuestaRS {

    /**
     * Código HTTP informado en el cuerpo.
     */
    private int status;

    /**
     * Mensaje para el usuario.
     */
    private String message;

    /**
     * Crea una respuesta con su código y mensaje.
     *
     * @param status  código HTTP.
     * @param message mensaje para el usuario.
     * @return respuesta lista para enviar.
     */
    public static MiRespuestaRS de(int status, String message) {
        MiRespuestaRS rta = new MiRespuestaRS();
        rta.setStatus(status);
        rta.setMessage(message);
        return rta;
    }
}
