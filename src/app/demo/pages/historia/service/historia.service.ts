import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio para consumir los endpoints de historias clínicas.
 */
@Injectable({
  providedIn: 'root'
})
export class HistoriaService {
  /** Ruta base del backend para las historias. */
  private api = `historia-medica`;

  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista las historias clínicas.
   * @returns lista de historias.
   */
  listarHistorias(): Observable<HistoriaMedica[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Consulta una historia por id.
   * @param historiaId id de la historia.
   * @returns la historia.
   */
  consultarHistoria(historiaId: number): Observable<HistoriaMedica> {
    const params = new HttpParams().set('historiaId', historiaId);
    return this.backendService.get(environment.apiUrlAuth, this.api, 'consultar', params);
  }

  /**
   * Crea una historia clínica (POST).
   * @param historia datos de la historia.
   * @returns respuesta del backend.
   */
  crearHistoria(historia: HistoriaMedica): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', historia);
  }
}
