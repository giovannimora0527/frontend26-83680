import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Anotacion } from 'src/app/models/anotacion';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio para consumir los endpoints de anotaciones de la historia.
 */
@Injectable({
  providedIn: 'root'
})
export class AnotacionService {
  /** Ruta base del backend para las anotaciones. */
  private api = `anotacion-historia`;

  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista las anotaciones de una historia.
   * @param historiaId id de la historia.
   * @returns anotaciones de la más reciente a la más antigua.
   */
  listarPorHistoria(historiaId: number): Observable<Anotacion[]> {
    const params = new HttpParams().set('historiaId', historiaId);
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar-by-historia', params);
  }

  /**
   * Agrega una anotación a una historia (POST).
   * @param anotacion datos de la anotación.
   * @returns respuesta del backend.
   */
  crearAnotacion(anotacion: Anotacion): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', anotacion);
  }
}
