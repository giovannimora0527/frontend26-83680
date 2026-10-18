package com.uniminuto.clinica.models;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

/**
 * Respuesta genérica paginada. Se reutiliza en todos los listados (citas, historias, fórmulas, anotaciones).
 *
 * @param <T> Tipo de elemento contenido en la página.
 * @author Juan Kamilo Rodriguez Diaz
 * @version 1.0
 */
@Data
@AllArgsConstructor
public class PaginaRs<T> {

    /** Elementos de la página actual. */
    private List<T> content;

    /** Número de página actual (empieza en 0). */
    private int page;

    /** Cantidad de elementos solicitados por página. */
    private int size;

    /** Total de elementos que cumplen los filtros. */
    private long totalElements;

    /** Total de páginas disponibles. */
    private int totalPages;
}
