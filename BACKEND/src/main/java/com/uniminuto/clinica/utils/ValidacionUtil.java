package com.uniminuto.clinica.utils;

import com.uniminuto.clinica.exception.BadRequestException;

/**
 * Utilidades de validación de campos recibidos desde el frontend. Todas lanzan
 * {@link BadRequestException} con un mensaje claro para el usuario.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
public final class ValidacionUtil {

    /** Clase utilitaria: no se instancia. */
    private ValidacionUtil() {
    }

    /**
     * Verifica que un valor no sea nulo.
     *
     * @param valor   Valor a revisar.
     * @param mensaje Mensaje de error si es nulo.
     */
    public static void requerido(Object valor, String mensaje) {
        if (valor == null) {
            throw new BadRequestException(mensaje);
        }
    }

    /**
     * Valida un texto obligatorio, lo recorta y verifica su longitud máxima.
     *
     * @param valor  Texto recibido.
     * @param campo  Nombre del campo, usado en el mensaje.
     * @param maximo Longitud máxima permitida.
     * @return El texto sin espacios sobrantes.
     */
    public static String textoObligatorio(String valor, String campo, int maximo) {
        if (valor == null || valor.isBlank()) {
            throw new BadRequestException("El campo " + campo + " es obligatorio.");
        }
        return validarLongitud(valor.trim(), campo, maximo);
    }

    /**
     * Valida un texto opcional: si viene vacío devuelve {@code null}.
     *
     * @param valor  Texto recibido.
     * @param campo  Nombre del campo, usado en el mensaje.
     * @param maximo Longitud máxima permitida.
     * @return El texto recortado o {@code null} si no se envió.
     */
    public static String textoOpcional(String valor, String campo, int maximo) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return validarLongitud(valor.trim(), campo, maximo);
    }

    /**
     * Verifica la longitud máxima de un texto ya recortado.
     *
     * @param valor  Texto a revisar.
     * @param campo  Nombre del campo.
     * @param maximo Longitud máxima.
     * @return El mismo texto si es válido.
     */
    private static String validarLongitud(String valor, String campo, int maximo) {
        if (valor.length() > maximo) {
            throw new BadRequestException("El campo " + campo + " no puede superar los " + maximo + " caracteres.");
        }
        return valor;
    }
}
