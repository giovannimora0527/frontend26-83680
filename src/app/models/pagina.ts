/**
 * Respuesta paginada genérica que devuelve el backend en los listados.
 *
 * @typeParam T tipo de elemento que contiene cada página.
 */
export interface Pagina<T> {
  /** Elementos de la página actual. */
  content: T[];
  /** Número de la página actual (empieza en 0). */
  page: number;
  /** Cantidad de registros por página. */
  size: number;
  /** Total de registros que cumplen los filtros, sin paginar. */
  totalElements: number;
  /** Total de páginas disponibles. */
  totalPages: number;
}
