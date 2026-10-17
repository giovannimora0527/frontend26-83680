import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Raza, RazaRq } from 'src/app/models/raza';
import { Mascota } from 'src/app/models/mascota';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/** Servicio de Angular que consume la API REST de razas. */
@Injectable({
  providedIn: 'root'
})
export class RazaService {
  /** Recurso del backend para las razas. */
  private readonly api = 'raza';

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista todas las razas.
   *
   * @returns lista de razas.
   */
  listar(): Observable<Raza[]> {
    return this.backendService.get<Raza[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Consulta una raza.
   *
   * @param razaId identificador de la raza.
   * @returns la raza encontrada.
   */
  consultar(razaId: number): Observable<Raza> {
    return this.backendService.get<Raza>(environment.apiUrlAuth, this.api, String(razaId));
  }

  /**
   * Registra una raza nueva.
   *
   * @param razaRq datos de la raza.
   * @returns mensaje de éxito.
   */
  guardar(razaRq: RazaRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.api, 'guardar', razaRq);
  }

  /**
   * Modifica una raza (PUT).
   *
   * @param razaId identificador de la raza.
   * @param razaRq nuevos datos.
   * @returns mensaje de éxito.
   */
  actualizar(razaId: number, razaRq: RazaRq): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, String(razaId), razaRq);
  }

  /**
   * Lista las mascotas registradas con una raza (para el detalle).
   *
   * @param razaId identificador de la raza.
   * @returns mascotas de esa raza.
   */
  listarMascotas(razaId: number): Observable<Mascota[]> {
    const params = new HttpParams().set('razaId', razaId);
    return this.backendService.get<Mascota[]>(environment.apiUrlAuth, 'mascota', 'listar-by-raza', params);
  }
}
