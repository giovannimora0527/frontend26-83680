import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Anotacion,
  AnotacionRq,
  CitaDisponible,
  FiltroAnotaciones,
  FiltroHistorias,
  HistoriaClinica,
  HistoriaRq
} from 'src/app/models/historia';
import { Pagina } from 'src/app/models/pagina';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { aParametros } from 'src/app/utils/parametros';
import { environment } from 'src/environments/environment';

/**
 * Servicio de Angular que consume la API REST de historias clínicas y de
 * sus anotaciones.
 */
@Injectable({
  providedIn: 'root'
})
export class HistoriaService {
  /** Recurso del backend para las historias clínicas. */
  private readonly apiHistoria = 'historia';
  /** Recurso del backend para las anotaciones. */
  private readonly apiAnotacion = 'anotacion';

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /**
   * Consulta una página de historias clínicas con orden y filtros.
   *
   * @param filtro página, orden y filtros elegidos por el usuario.
   * @returns página de historias.
   */
  listar(filtro: FiltroHistorias): Observable<Pagina<HistoriaClinica>> {
    return this.backendService.get<Pagina<HistoriaClinica>>(
      environment.apiUrlAuth, this.apiHistoria, 'listar', aParametros(filtro));
  }

  /**
   * Consulta el detalle de una historia clínica.
   *
   * @param historiaId identificador de la historia.
   * @returns la historia encontrada.
   */
  consultar(historiaId: number): Observable<HistoriaClinica> {
    return this.backendService.get<HistoriaClinica>(environment.apiUrlAuth, this.apiHistoria, String(historiaId));
  }

  /**
   * Registra una historia clínica nueva.
   *
   * @param historiaRq datos de la historia.
   * @returns mensaje de éxito.
   */
  guardar(historiaRq: HistoriaRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.apiHistoria, 'guardar', historiaRq);
  }

  /**
   * Cierra una historia clínica: deja de admitir anotaciones y fórmulas.
   *
   * @param historiaId identificador de la historia.
   * @returns mensaje de éxito.
   */
  cerrar(historiaId: number): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.apiHistoria, `${historiaId}/cerrar`, {});
  }

  /**
   * Lista las citas atendidas de una mascota que aún no tienen historia clínica.
   *
   * @param mascotaId identificador de la mascota.
   * @returns citas disponibles.
   */
  listarCitasDisponibles(mascotaId: number): Observable<CitaDisponible[]> {
    const params = new HttpParams().set('mascotaId', mascotaId);
    return this.backendService.get<CitaDisponible[]>(
      environment.apiUrlAuth, this.apiHistoria, 'citas-disponibles', params);
  }

  /**
   * Consulta una página de anotaciones de una historia clínica.
   *
   * @param filtro historia, página, orden y texto de búsqueda.
   * @returns página de anotaciones.
   */
  listarAnotaciones(filtro: FiltroAnotaciones): Observable<Pagina<Anotacion>> {
    return this.backendService.get<Pagina<Anotacion>>(
      environment.apiUrlAuth, this.apiAnotacion, 'listar', aParametros(filtro));
  }

  /**
   * Consulta el detalle de una anotación.
   *
   * @param anotacionId identificador de la anotación.
   * @returns la anotación encontrada.
   */
  consultarAnotacion(anotacionId: number): Observable<Anotacion> {
    return this.backendService.get<Anotacion>(environment.apiUrlAuth, this.apiAnotacion, String(anotacionId));
  }

  /**
   * Agrega una anotación a una historia clínica existente.
   *
   * @param anotacionRq datos de la anotación.
   * @returns mensaje de éxito.
   */
  guardarAnotacion(anotacionRq: AnotacionRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.apiAnotacion, 'guardar', anotacionRq);
  }
}
