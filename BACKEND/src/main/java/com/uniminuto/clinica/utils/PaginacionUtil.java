package com.uniminuto.clinica.utils;

import com.uniminuto.clinica.exception.BadRequestException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Map;

/**
 * Utilidad común para construir la paginación y el ordenamiento de los listados.
 * Valida los parámetros y solo permite ordenar por campos de una lista blanca,
 * evitando que el cliente indique rutas arbitrarias de la entidad.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
public final class PaginacionUtil {

    /** Tamaño máximo de página permitido. */
    private static final int TAMANO_MAXIMO = 100;

    /** Clase utilitaria: no se instancia. */
    private PaginacionUtil() {
    }

    /**
     * Construye el objeto de paginación. Siempre agrega el id descendente como desempate
     * para que el orden sea estable entre páginas.
     *
     * @param page    Número de página (desde 0).
     * @param size    Tamaño de página (1 a 100).
     * @param sortBy  Nombre público del campo de orden.
     * @param sortDir Dirección: asc o desc.
     * @param campos  Mapa nombre público -> ruta real en la entidad (lista blanca).
     * @return Objeto de paginación listo para el repositorio.
     * @throws BadRequestException si algún parámetro no es válido.
     */
    public static Pageable construir(int page, int size, String sortBy, String sortDir,
                                     Map<String, String> campos) {
        if (page < 0) {
            throw new BadRequestException("El número de página no puede ser negativo.");
        }
        if (size < 1 || size > TAMANO_MAXIMO) {
            throw new BadRequestException("El tamaño de página debe estar entre 1 y " + TAMANO_MAXIMO + ".");
        }
        String ruta = campos.get(sortBy);
        if (ruta == null) {
            throw new BadRequestException("No se puede ordenar por '" + sortBy + "'. Campos permitidos: "
                    + campos.keySet() + ".");
        }
        if (!"asc".equalsIgnoreCase(sortDir) && !"desc".equalsIgnoreCase(sortDir)) {
            throw new BadRequestException("La dirección de orden debe ser 'asc' o 'desc'.");
        }
        Sort orden = Sort.by(Sort.Direction.fromString(sortDir), ruta)
                .and(Sort.by(Sort.Direction.DESC, "id"));
        return PageRequest.of(page, size, orden);
    }
}
