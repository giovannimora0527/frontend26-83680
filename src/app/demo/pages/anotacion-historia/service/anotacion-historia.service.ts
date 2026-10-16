import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnotacionHistoria } from 'src/app/models/anotacion-historia';
import { AnotacionHistoriaRq } from 'src/app/models/anotacion-historia-rq';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnotacionHistoriaService {
  private api = `anotacion-historia`;

  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista todas las anotaciones registradas en un rango amplio de fechas.
   * @returns Observable con la lista de anotaciones.
   */
  listar(): Observable<AnotacionHistoria[]> {
    const params = new HttpParams()
      .set('fechaInicial', '2020-01-01T00:00:00')
      .set('fechaFinal', '2030-01-01T00:00:00');

    return this.backendService.get<AnotacionHistoria[]>(environment.apiUrlAuth, this.api, 'listar', params);
  }

  /**
   * Lista las anotaciones de una historia médica, de la más reciente a la más antigua.
   * @param historiaMedicaId Identificador de la historia.
   * @returns Observable con las anotaciones de la historia.
   */
  listarPorHistoria(historiaMedicaId: number): Observable<AnotacionHistoria[]> {
    const params = new HttpParams().set('historiaMedicaId', historiaMedicaId);
    return this.backendService.get<AnotacionHistoria[]>(environment.apiUrlAuth, this.api, 'listar-by-historia', params);
  }

  /**
   * Agrega una anotación a una historia médica abierta.
   * @param anotacionRq Datos de la anotación.
   * @returns Observable con la respuesta del backend.
   */
  guardar(anotacionRq: AnotacionHistoriaRq): Observable<MiRespuesta> {
    return this.backendService.post<MiRespuesta>(environment.apiUrlAuth, this.api, 'guardar', anotacionRq);
  }
}
