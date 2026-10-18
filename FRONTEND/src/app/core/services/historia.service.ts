import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { ConsultaPagina, Pagina } from '../models/comun';
import { FiltroHistoria, HistoriaDetalle, HistoriaResumen, HistoriaRq } from '../models/historia';
import { construirParams } from '../utils/params';

/** Consumo de la API REST de historias clínicas. */
@Injectable({ providedIn: 'root' })
export class HistoriaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/historia`;

  /**
   * Lista historias con paginación, orden y filtros.
   * @param consulta Página, tamaño y orden.
   * @param filtros Filtros opcionales.
   * @returns Página de historias (resumen).
   */
  listar(consulta: ConsultaPagina, filtros: FiltroHistoria): Observable<Pagina<HistoriaResumen>> {
    return this.http.get<Pagina<HistoriaResumen>>(`${this.base}/listar`, { params: construirParams({ ...consulta, ...filtros }) });
  }

  /**
   * @param id Identificador de la historia.
   * @returns Detalle completo de la historia.
   */
  obtener(id: number): Observable<HistoriaDetalle> {
    return this.http.get<HistoriaDetalle>(`${this.base}/obtener/${id}`);
  }

  /**
   * @param rq Datos de la historia a crear.
   * @returns Detalle de la historia creada.
   */
  crear(rq: HistoriaRq): Observable<HistoriaDetalle> {
    return this.http.post<HistoriaDetalle>(`${this.base}/crear`, rq);
  }

  /**
   * Cierra una historia clínica (queda en solo lectura).
   * @param id Identificador de la historia.
   * @returns Detalle de la historia cerrada.
   */
  cerrar(id: number): Observable<HistoriaDetalle> {
    return this.http.patch<HistoriaDetalle>(`${this.base}/cerrar/${id}`, {});
  }
}
