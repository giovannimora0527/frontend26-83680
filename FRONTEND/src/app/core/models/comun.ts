/** Página de resultados que devuelve el backend (PaginaRs). */
export interface Pagina<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Cuerpo de error estándar del backend (ErrorResponse). */
export interface ErrorApi {
  status: number;
  error: string;
  message: string;
}

/** Parámetros comunes de paginación y ordenamiento de los listados. */
export interface ConsultaPagina {
  page: number;
  size: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}
