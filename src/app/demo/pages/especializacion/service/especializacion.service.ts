import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Especializacion, EspecializacionRq } from 'src/app/models/especializacion';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/** Servicio de Angular que consume la API REST de especializaciones médicas. */
@Injectable({
  providedIn: 'root'
})
export class EspecializacionService {
  /** Recurso del backend para las especializaciones. */
  private readonly api = 'especializacion';

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista todas las especializaciones.
   *
   * @returns lista de especializaciones.
   */
  listar(): Observable<Especializacion[]> {
    return this.backendService.get<Especializacion[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Consulta una especialización.
   *
   * @param id identificador de la especialización.
   * @returns la especialización encontrada.
   */
  consultar(id: number): Observable<Especializacion> {
    return this.backendService.get<Especializacion>(environment.apiUrlAuth, this.api, String(id));
  }

  /**
   * Registra una especialización nueva.
   *
   * @param rq datos de la especialización.
   * @returns mensaje de éxito.
   */
  guardar(rq: EspecializacionRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.api, 'guardar', rq);
  }

  /**
   * Modifica una especialización (PUT).
   *
   * @param id identificador de la especialización.
   * @param rq nuevos datos.
   * @returns mensaje de éxito.
   */
  actualizar(id: number, rq: EspecializacionRq): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, String(id), rq);
  }
}
