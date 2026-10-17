package com.uniminuto.clinica.entity;

/**
 * Estados posibles de una cita médica y las transiciones permitidas entre ellos.
 * <p>
 * Reglas: una cita ATENDIDA o CANCELADA es un estado final; una cita cancelada
 * solo vuelve a estar activa mediante la operación explícita de reactivación.
 * </p>
 */
public enum EstadoCita {

    PENDIENTE,
    CONFIRMADA,
    ATENDIDA,
    CANCELADA,
    PROGRAMADA;

    /**
     * Indica si una cita en este estado puede pasar al estado destino.
     * Permanecer en el mismo estado siempre es válido.
     *
     * @param destino estado al que se quiere pasar.
     * @return true si la transición está permitida.
     */
    public boolean puedePasarA(EstadoCita destino) {
        if (this == destino) {
            return true;
        }
        switch (this) {
            case PENDIENTE:
                return destino == CONFIRMADA
                        || destino == PROGRAMADA
                        || destino == CANCELADA;
            case PROGRAMADA:
                return destino == CONFIRMADA
                        || destino == ATENDIDA
                        || destino == CANCELADA;
            case CONFIRMADA:
                return destino == ATENDIDA
                        || destino == CANCELADA;
            default:
                return false;
        }
    }

    /**
     * Indica si es un estado final del que no se puede salir editando la cita.
     *
     * @return true para ATENDIDA y CANCELADA.
     */
    public boolean esFinal() {
        return this == ATENDIDA || this == CANCELADA;
    }
}
