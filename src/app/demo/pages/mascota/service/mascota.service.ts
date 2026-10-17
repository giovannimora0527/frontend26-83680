import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Mascota, MascotaRq } from 'src/app/models/mascota';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/** Servicio de Angular que consume la API REST de mascotas. */
@Injectable({
  providedIn: 'root'
})
export class MascotaService {
  /** Recurso del backend para las mascotas. */
  private readonly api = 'mascota';

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista todas las mascotas con su raza y su dueño.
   *
   * @returns lista de mascotas.
   */
  listar(): Observable<Mascota[]> {
    return this.backendService.get<Mascota[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Consulta una mascota.
   *
   * @param mascotaId identificador de la mascota.
   * @returns la mascota encontrada.
   */
  consultar(mascotaId: number): Observable<Mascota> {
    return this.backendService.get<Mascota>(environment.apiUrlAuth, this.api, String(mascotaId));
  }

  /**
   * Registra una mascota nueva.
   *
   * @param rq datos de la mascota (con su dueño).
   * @returns mensaje de éxito.
   */
  guardar(rq: MascotaRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.api, 'guardar', rq);
  }

  /**
   * Modifica nombre, edad y raza de una mascota (PUT).
   *
   * @param mascotaId identificador de la mascota.
   * @param rq nuevos datos.
   * @returns mensaje de éxito.
   */
  actualizar(mascotaId: number, rq: MascotaRq): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, String(mascotaId), rq);
  }
}
