package com.uniminuto.clinica.enums;

import com.uniminuto.clinica.exception.BadRequestException;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

/**
 * Estados posibles de una cita médica y las transiciones permitidas entre ellos.
 * <p>
 * Justificación de las transiciones: una cita atendida o cancelada es un hecho histórico
 * y no puede volver atrás; una cancelada solo se recupera con la operación explícita de reactivar.
 * </p>
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
public enum EstadoCita {
    /** Cita registrada, aún sin confirmar. */
    PENDIENTE,
    /** Cita confirmada por el cliente. */
    CONFIRMADA,
    /** Cita ya atendida; permite generar historia clínica. */
    ATENDIDA,
    /** Cita cancelada; no puede modificarse como si siguiera activa. */
    CANCELADA,
    /** Cita programada en agenda. */
    PROGRAMADA;

    /**
     * Convierte un texto al estado correspondiente, ignorando mayúsculas y espacios.
     *
     * @param valor Texto recibido (por ejemplo "pendiente").
     * @return Estado equivalente.
     * @throws BadRequestException si el texto es vacío o no corresponde a un estado.
     */
    public static EstadoCita desde(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new BadRequestException("El estado de la cita es obligatorio.");
        }
        try {
            return valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("El estado '" + valor + "' no es válido. Valores permitidos: "
                    + Arrays.toString(values()) + ".");
        }
    }

    /**
     * Indica a qué estados puede pasar la cita desde el estado actual.
     *
     * @return Conjunto de estados destino permitidos (vacío si es un estado final).
     */
    public Set<EstadoCita> transicionesPermitidas() {
        return switch (this) {
            case PENDIENTE -> EnumSet.of(CONFIRMADA, PROGRAMADA, CANCELADA);
            case PROGRAMADA -> EnumSet.of(CONFIRMADA, CANCELADA);
            case CONFIRMADA -> EnumSet.of(ATENDIDA, CANCELADA);
            case ATENDIDA, CANCELADA -> EnumSet.noneOf(EstadoCita.class);
        };
    }
}
