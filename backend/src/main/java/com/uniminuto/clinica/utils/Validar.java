package com.uniminuto.clinica.utils;

import com.uniminuto.clinica.exception.BadRequestException;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Validaciones reutilizables del backend (se repiten en el frontend).
 */
public final class Validar {

    private Validar() {
    }

    public static boolean vacio(String valor) {
        return valor == null || valor.trim().isEmpty();
    }

    /** Devuelve el texto sin espacios o null si está vacío. */
    public static String limpiar(String valor) {
        return vacio(valor) ? null : valor.trim();
    }

    public static String texto(String valor, String campo, int maximo) {
        if (vacio(valor)) {
            throw new BadRequestException("El campo '" + campo + "' es obligatorio.");
        }
        String limpio = valor.trim();
        if (limpio.length() > maximo) {
            throw new BadRequestException("El campo '" + campo + "' admite máximo " + maximo + " caracteres.");
        }
        return limpio;
    }

    public static String textoOpcional(String valor, String campo, int maximo) {
        String limpio = limpiar(valor);
        if (limpio != null && limpio.length() > maximo) {
            throw new BadRequestException("El campo '" + campo + "' admite máximo " + maximo + " caracteres.");
        }
        return limpio;
    }

    public static <T> T obligatorio(T valor, String campo) {
        if (valor == null) {
            throw new BadRequestException("El campo '" + campo + "' es obligatorio.");
        }
        return valor;
    }

    public static long idValido(Number id, String campo) {
        if (id == null || id.longValue() <= 0) {
            throw new BadRequestException("El campo '" + campo + "' es obligatorio y debe ser mayor a cero.");
        }
        return id.longValue();
    }

    public static int entero(Integer valor, String campo, int minimo, int maximo) {
        if (valor == null) {
            throw new BadRequestException("El campo '" + campo + "' es obligatorio.");
        }
        if (valor < minimo || valor > maximo) {
            throw new BadRequestException("El campo '" + campo + "' debe estar entre " + minimo + " y " + maximo + ".");
        }
        return valor;
    }

    public static BigDecimal dinero(BigDecimal valor, String campo, boolean permitirCero) {
        if (valor == null) {
            throw new BadRequestException("El campo '" + campo + "' es obligatorio.");
        }
        int signo = valor.signum();
        if (signo < 0 || (!permitirCero && signo == 0)) {
            throw new BadRequestException("El campo '" + campo + "' debe ser "
                    + (permitirCero ? "mayor o igual a cero." : "mayor a cero."));
        }
        return redondear(valor);
    }

    public static BigDecimal porcentaje(BigDecimal valor, String campo) {
        if (valor == null) {
            return BigDecimal.ZERO;
        }
        if (valor.signum() < 0 || valor.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BadRequestException("El campo '" + campo + "' debe estar entre 0 y 100.");
        }
        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal redondear(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor.setScale(2, RoundingMode.HALF_UP);
    }

    public static String enLista(String valor, java.util.Collection<String> permitidos, String campo) {
        if (vacio(valor) || !permitidos.contains(valor.trim().toUpperCase())) {
            throw new BadRequestException("El campo '" + campo + "' debe ser uno de: " + String.join(", ", permitidos) + ".");
        }
        return valor.trim().toUpperCase();
    }
}
