package com.uniminuto.clinica.models;

import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Respuesta genérica para listados paginados.
 *
 * @param <T> tipo de elemento que contiene la página.
 */
@Data
public class PaginaRs<T> {

    /**
     * Elementos de la página actual.
     */
    private List<T> content;

    /**
     * Número de la página actual (empieza en 0).
     */
    private int page;

    /**
     * Cantidad de registros por página.
     */
    private int size;

    /**
     * Total de registros que cumplen los filtros, sin paginar.
     */
    private long totalElements;

    /**
     * Total de páginas disponibles.
     */
    private int totalPages;

    /**
     * Construye la respuesta a partir de una página de Spring Data.
     *
     * @param pagina página ya consultada y convertida al tipo de salida.
     * @param <T>    tipo de elemento de la página.
     * @return la respuesta paginada lista para enviar al cliente.
     */
    public static <T> PaginaRs<T> desde(Page<T> pagina) {
        PaginaRs<T> rs = new PaginaRs<>();
        rs.setContent(pagina.getContent());
        rs.setPage(pagina.getNumber());
        rs.setSize(pagina.getSize());
        rs.setTotalElements(pagina.getTotalElements());
        rs.setTotalPages(pagina.getTotalPages());
        return rs;
    }
}
