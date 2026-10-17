import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Medico, MedicoRq } from 'src/app/models/medico';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/** Servicio de Angular que consume la API REST de veterinarios. */
@Injectable({
  providedIn: 'root'
})
export class MedicoService {
  /** Recurso del backend para los veterinarios. */
  private readonly api = 'medico';

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista todos los veterinarios con su especialización.
   *
   * @returns lista de veterinarios.
   */
  listar(): Observable<Medico[]> {
    return this.backendService.get<Medico[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Consulta un veterinario.
   *
   * @param id identificador del veterinario.
   * @returns el veterinario encontrado.
   */
  consultar(id: number): Observable<Medico> {
    return this.backendService.get<Medico>(environment.apiUrlAuth, this.api, String(id));
  }

  /**
   * Registra un veterinario nuevo.
   *
   * @param rq datos del veterinario.
   * @returns mensaje de éxito.
   */
  guardar(rq: MedicoRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.api, 'guardar', rq);
  }

  /**
   * Modifica un veterinario (PUT).
   *
   * @param id identificador del veterinario.
   * @param rq nuevos datos.
   * @returns mensaje de éxito.
   */
  actualizar(id: number, rq: MedicoRq): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, String(id), rq);
  }
}
