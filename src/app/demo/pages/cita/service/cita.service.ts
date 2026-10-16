import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita } from 'src/app/models/cita';
import { CitaRq } from 'src/app/models/cita-rq';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private api = `cita`;

  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista todas las citas, el backend las devuelve de la más reciente a la más antigua.
   * @returns Observable con la lista de citas.
   */
  listar(): Observable<Cita[]> {
    return this.backendService.get<Cita[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Consulta una cita por su identificador.
   * @param citaId Identificador de la cita.
   * @returns Observable con la cita.
   */
  consultar(citaId: number): Observable<Cita> {
    const params = new HttpParams().set('citaId', citaId);
    return this.backendService.get<Cita>(environment.apiUrlAuth, this.api, 'consultar', params);
  }

  /**
   * Lista las citas de una mascota (combos de historia clínica y fórmula).
   * @param mascotaId Identificador de la mascota.
   * @returns Observable con las citas de la mascota.
   */
  listarPorMascota(mascotaId: number): Observable<Cita[]> {
    const params = new HttpParams().set('mascotaId', mascotaId);
    return this.backendService.get<Cita[]>(environment.apiUrlAuth, this.api, 'listar-by-mascota', params);
  }

  /**
   * Crea una cita nueva.
   * @param citaRq Datos de la cita.
   * @returns Observable con la respuesta del backend.
   */
  guardar(citaRq: CitaRq): Observable<MiRespuesta> {
    return this.backendService.post<MiRespuesta>(environment.apiUrlAuth, this.api, 'guardar', citaRq);
  }

  /**
   * Actualiza una cita existente.
   * @param citaRq Datos de la cita.
   * @returns Observable con la respuesta del backend.
   */
  actualizar(citaRq: CitaRq): Observable<MiRespuesta> {
    return this.backendService.put<MiRespuesta>(environment.apiUrlAuth, this.api, 'actualizar', citaRq);
  }

  /**
   * Reactiva una cita cancelada.
   * @param citaId Identificador de la cita.
   * @returns Observable con la respuesta del backend.
   */
  reactivar(citaId: number): Observable<MiRespuesta> {
    const params = new HttpParams().set('citaId', citaId);
    return this.backendService.patch<MiRespuesta>(environment.apiUrlAuth, this.api, 'reactivar', {}, params);
  }
}
