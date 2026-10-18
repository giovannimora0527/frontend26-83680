import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { ConsultaPagina, Pagina } from '../models/comun';
import { Anotacion, AnotacionRq, FiltroAnotacion } from '../models/historia';
import { construirParams } from '../utils/params';

/** Consumo de la API REST de anotaciones de historia clínica. */
@Injectable({ providedIn: 'root' })
export class AnotacionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/anotacion`;

  /**
   * Lista anotaciones (más recientes primero por defecto).
   * @param consulta Página, tamaño y orden.
   * @param filtros Filtros opcionales (historia, mascota, texto, fechas).
   * @returns Página de anotaciones.
   */
  listar(consulta: ConsultaPagina, filtros: FiltroAnotacion): Observable<Pagina<Anotacion>> {
    return this.http.get<Pagina<Anotacion>>(`${this.base}/listar`, { params: construirParams({ ...consulta, ...filtros }) });
  }

  /**
   * @param id Identificador de la anotación.
   * @returns La anotación consultada.
   */
  obtener(id: number): Observable<Anotacion> {
    return this.http.get<Anotacion>(`${this.base}/obtener/${id}`);
  }

  /**
   * @param rq Datos de la anotación.
   * @returns La anotación creada.
   */
  crear(rq: AnotacionRq): Observable<Anotacion> {
    return this.http.post<Anotacion>(`${this.base}/crear`, rq);
  }
}
