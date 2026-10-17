package com.uniminuto.clinica.util;

import com.uniminuto.clinica.exception.BadRequestException;

import java.util.regex.Pattern;

/**
 * Validaciones de texto compartidas por los servicios. Lanzan
 * {@link BadRequestException} con un mensaje comprensible para el usuario.
 */
public final class Validaciones {

    /**
     * Solo letras (con tildes y ñ), espacios, apóstrofo y guion.
     */
    public static final Pattern SOLO_LETRAS = Pattern.compile("^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$");

    /**
     * Clase utilitaria: no se instancia.
     */
    private Validaciones() {
    }

    /**
     * Valida un texto obligatorio y lo devuelve sin espacios sobrantes.
     *
     * @param valor  texto recibido.
     * @param nombre nombre del campo (por ejemplo "El nombre").
     * @param maximo longitud máxima.
     * @return texto validado.
     */
    public static String obligatorio(String valor, String nombre, int maximo) {
        if (valor == null || valor.isBlank()) {
            throw new BadRequestException("Debe indicar " + minusculaInicial(nombre));
        }
        String limpio = valor.trim();
        if (limpio.length() > maximo) {
            throw new BadRequestException(nombre + " no puede superar los " + maximo + " caracteres");
        }
        return limpio;
    }

    /**
     * Pasa a minúscula la primera letra ("La descripción" → "la descripción").
     *
     * @param texto texto original.
     * @return texto con la primera letra en minúscula.
     */
    public static String minusculaInicial(String texto) {
        return texto.isEmpty() ? texto : Character.toLowerCase(texto.charAt(0)) + texto.substring(1);
    }

    /**
     * Valida un texto opcional; devuelve null si viene vacío.
     *
     * @param valor  texto recibido.
     * @param nombre nombre del campo.
     * @param maximo longitud máxima.
     * @return texto validado o null.
     */
    public static String opcional(String valor, String nombre, int maximo) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return obligatorio(valor, nombre, maximo);
    }

    /**
     * Valida que un texto obligatorio cumpla un patrón.
     *
     * @param valor   texto recibido.
     * @param nombre  nombre del campo.
     * @param maximo  longitud máxima.
     * @param patron  patrón que debe cumplir.
     * @param mensaje mensaje si no lo cumple.
     * @return texto validado.
     */
    public static String conPatron(String valor, String nombre, int maximo, Pattern patron, String mensaje) {
        String limpio = obligatorio(valor, nombre, maximo);
        if (!patron.matcher(limpio).matches()) {
            throw new BadRequestException(mensaje);
        }
        return limpio;
    }
}
