import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { ConsultaPagina, Pagina } from '../models/comun';
import { FiltroFormula, FormulaDetalle, FormulaResumen, FormulaRq } from '../models/formula';
import { construirParams } from '../utils/params';

/** Consumo de la API REST de fórmulas médicas. */
@Injectable({ providedIn: 'root' })
export class FormulaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/formula`;

  /**
   * Lista fórmulas con paginación, orden y filtros.
   * @param consulta Página, tamaño y orden.
   * @param filtros Filtros opcionales.
   * @returns Página de fórmulas (resumen).
   */
  listar(consulta: ConsultaPagina, filtros: FiltroFormula): Observable<Pagina<FormulaResumen>> {
    return this.http.get<Pagina<FormulaResumen>>(`${this.base}/listar`, { params: construirParams({ ...consulta, ...filtros }) });
  }

  /**
   * @param id Identificador de la fórmula.
   * @returns Detalle completo.
   */
  obtener(id: number): Observable<FormulaDetalle> {
    return this.http.get<FormulaDetalle>(`${this.base}/obtener/${id}`);
  }

  /**
   * @param rq Datos de la fórmula.
   * @returns Detalle de la fórmula creada.
   */
  crear(rq: FormulaRq): Observable<FormulaDetalle> {
    return this.http.post<FormulaDetalle>(`${this.base}/crear`, rq);
  }

  /**
   * @param id Identificador de la fórmula.
   * @param rq Nuevos datos.
   * @returns Detalle de la fórmula actualizada.
   */
  actualizar(id: number, rq: FormulaRq): Observable<FormulaDetalle> {
    return this.http.put<FormulaDetalle>(`${this.base}/actualizar/${id}`, rq);
  }

  /**
   * Inactiva una fórmula (no existe eliminación física).
   * @param id Identificador de la fórmula.
   * @returns Detalle de la fórmula inactivada.
   */
  inactivar(id: number): Observable<FormulaDetalle> {
    return this.http.patch<FormulaDetalle>(`${this.base}/inactivar/${id}`, {});
  }
}
