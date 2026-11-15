package com.uniminuto.clinica.util;

import com.uniminuto.clinica.exception.BadRequestException;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Cálculos de valores monetarios con dos decimales y redondeo comercial.
 */
public final class Dinero {

    /** Cien, para porcentajes. */
    private static final BigDecimal CIEN = BigDecimal.valueOf(100);

    /** Valor máximo aceptado para una tarifa o un pago. */
    public static final BigDecimal MAXIMO = new BigDecimal("999999999.99");

    private Dinero() {
    }

    /**
     * Redondea a dos decimales.
     *
     * @param valor valor.
     * @return valor redondeado (0 si es nulo).
     */
    public static BigDecimal redondear(BigDecimal valor) {
        return (valor == null ? BigDecimal.ZERO : valor).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calcula un porcentaje de un valor.
     *
     * @param base       valor base.
     * @param porcentaje porcentaje (0 a 100).
     * @return valor del porcentaje, redondeado.
     */
    public static BigDecimal porcentaje(BigDecimal base, BigDecimal porcentaje) {
        return redondear(base.multiply(porcentaje).divide(CIEN, 6, RoundingMode.HALF_UP));
    }

    /**
     * Valida un valor monetario: no negativo, máximo dos decimales y dentro del límite.
     *
     * @param valor  valor.
     * @param nombre nombre del campo para el mensaje.
     * @param positivo si debe ser mayor que cero.
     * @return el valor redondeado.
     */
    public static BigDecimal validar(BigDecimal valor, String nombre, boolean positivo) {
        if (valor == null) {
            throw new BadRequestException(nombre + " es obligatorio");
        }
        if (positivo ? valor.signum() <= 0 : valor.signum() < 0) {
            throw new BadRequestException(nombre + (positivo ? " debe ser mayor que 0" : " no puede ser negativo"));
        }
        if (valor.stripTrailingZeros().scale() > 2) {
            throw new BadRequestException(nombre + " admite máximo dos decimales");
        }
        if (valor.compareTo(MAXIMO) > 0) {
            throw new BadRequestException(nombre + " supera el valor máximo permitido");
        }
        return redondear(valor);
    }

    /**
     * Valida un porcentaje entre 0 y 100 con máximo dos decimales.
     *
     * @param valor  porcentaje (null = 0).
     * @param nombre nombre del campo.
     * @return el porcentaje.
     */
    public static BigDecimal validarPorcentaje(BigDecimal valor, String nombre) {
        BigDecimal v = valor == null ? BigDecimal.ZERO : valor;
        if (v.signum() < 0 || v.compareTo(CIEN) > 0 || v.stripTrailingZeros().scale() > 2) {
            throw new BadRequestException(nombre + " debe estar entre 0 y 100 con máximo dos decimales");
        }
        return v.setScale(2, RoundingMode.HALF_UP);
    }
}
