import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { Cita, CitaRq, EstadoCita, FiltroCita } from '../models/cita';
import { ConsultaPagina, Pagina } from '../models/comun';
import { construirParams } from '../utils/params';

/** Consumo de la API REST de citas. */
@Injectable({ providedIn: 'root' })
export class CitaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/cita`;

  /**
   * Lista citas con paginación, orden y filtros.
   * @param consulta Página, tamaño y orden.
   * @param filtros Filtros opcionales.
   * @returns Página de citas.
   */
  listar(consulta: ConsultaPagina, filtros: FiltroCita): Observable<Pagina<Cita>> {
    return this.http.get<Pagina<Cita>>(`${this.base}/listar`, { params: construirParams({ ...consulta, ...filtros }) });
  }

  /**
   * @param id Identificador de la cita.
   * @returns La cita consultada.
   */
  obtener(id: number): Observable<Cita> {
    return this.http.get<Cita>(`${this.base}/obtener/${id}`);
  }

  /**
   * @param rq Datos de la nueva cita.
   * @returns La cita creada.
   */
  crear(rq: CitaRq): Observable<Cita> {
    return this.http.post<Cita>(`${this.base}/crear`, rq);
  }

  /**
   * @param id Identificador de la cita.
   * @param rq Nuevos datos.
   * @returns La cita actualizada.
   */
  actualizar(id: number, rq: CitaRq): Observable<Cita> {
    return this.http.put<Cita>(`${this.base}/actualizar/${id}`, rq);
  }

  /**
   * Cambia solo el estado de una cita.
   * @param id Identificador de la cita.
   * @param estado Nuevo estado.
   * @returns La cita actualizada.
   */
  cambiarEstado(id: number, estado: EstadoCita): Observable<Cita> {
    return this.http.patch<Cita>(`${this.base}/cambiar-estado/${id}`, { estado });
  }

  /**
   * Reactiva una cita cancelada (operación explícita).
   * @param id Identificador de la cita.
   * @returns La cita reactivada.
   */
  reactivar(id: number): Observable<Cita> {
    return this.http.patch<Cita>(`${this.base}/reactivar/${id}`, {});
  }
}
