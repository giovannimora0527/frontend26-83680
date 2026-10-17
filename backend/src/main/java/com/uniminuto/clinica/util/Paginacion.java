package com.uniminuto.clinica.util;

import com.uniminuto.clinica.exception.BadRequestException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.Map;

/**
 * Utilidades compartidas por los listados paginados: validan la página y el
 * rango de fechas, y traducen la columna de orden pedida por el frontend al
 * campo real de la entidad.
 */
public final class Paginacion {

    /**
     * Tamaño máximo de página permitido.
     */
    public static final int TAMANO_MAXIMO = 100;

    /**
     * Clase utilitaria: no se instancia.
     */
    private Paginacion() {
    }

    /**
     * Valida los parámetros y arma la página solicitada.
     *
     * @param page         página (empieza en 0).
     * @param size         registros por página.
     * @param orden        columna pedida por el frontend.
     * @param direccion    asc o desc (por defecto desc).
     * @param columnas     columnas permitidas y su campo en la entidad.
     * @param campoDefecto campo a usar si la columna no es válida o no se envía.
     * @param campoId      identificador, para desempatar y tener un orden estable.
     * @return página lista para el repositorio.
     */
    public static Pageable crear(int page, int size, String orden, String direccion,
                                 Map<String, String> columnas, String campoDefecto, String campoId) {
        if (page < 0) {
            throw new BadRequestException("La página no puede ser negativa");
        }
        if (size < 1 || size > TAMANO_MAXIMO) {
            throw new BadRequestException("El tamaño de página debe estar entre 1 y " + TAMANO_MAXIMO);
        }
        String campo = columnas.getOrDefault(orden == null ? "" : orden.trim().toLowerCase(), campoDefecto);
        Sort.Direction sentido = "asc".equalsIgnoreCase(direccion) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(sentido, campo).and(Sort.by(sentido, campoId)));
    }

    /**
     * Valida que la fecha inicial no sea posterior a la final.
     *
     * @param desde fecha inicial (puede ser nula).
     * @param hasta fecha final (puede ser nula).
     */
    public static void validarRango(LocalDate desde, LocalDate hasta) {
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new BadRequestException("La fecha inicial no puede ser posterior a la fecha final");
        }
    }

    /**
     * Convierte un texto en un valor de un enum, con un mensaje claro si no es válido.
     *
     * @param tipo  clase del enum.
     * @param valor texto recibido (vacío = null).
     * @param <E>   tipo del enum.
     * @return el valor del enum, o null si no se envió.
     */
    public static <E extends Enum<E>> E convertirEnum(Class<E> tipo, String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return Enum.valueOf(tipo, valor.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("El valor '" + valor + "' no es válido");
        }
    }
}
