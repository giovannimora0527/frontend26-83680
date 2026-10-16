import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { HistoriaMedicaRq } from 'src/app/models/historia-medica-rq';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HistoriaMedicaService {
  private api = `historia-medica`;

  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista las historias médicas, de la consulta más reciente a la más antigua.
   * @returns Observable con la lista de historias.
   */
  listar(): Observable<HistoriaMedica[]> {
    return this.backendService.get<HistoriaMedica[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Consulta una historia médica por su identificador.
   * @param historiaMedicaId Identificador de la historia.
   * @returns Observable con la historia.
   */
  consultar(historiaMedicaId: number): Observable<HistoriaMedica> {
    const params = new HttpParams().set('historiaMedicaId', historiaMedicaId);
    return this.backendService.get<HistoriaMedica>(environment.apiUrlAuth, this.api, 'consultar', params);
  }

  /**
   * Crea una historia médica a partir de una cita atendida.
   * @param historiaRq Datos de la historia.
   * @returns Observable con la respuesta del backend.
   */
  guardar(historiaRq: HistoriaMedicaRq): Observable<MiRespuesta> {
    return this.backendService.post<MiRespuesta>(environment.apiUrlAuth, this.api, 'guardar', historiaRq);
  }

  /**
   * Actualiza el diagnóstico, las observaciones y el estado de una historia.
   * @param historiaRq Datos de la historia.
   * @returns Observable con la respuesta del backend.
   */
  actualizar(historiaRq: HistoriaMedicaRq): Observable<MiRespuesta> {
    return this.backendService.put<MiRespuesta>(environment.apiUrlAuth, this.api, 'actualizar', historiaRq);
  }
}
