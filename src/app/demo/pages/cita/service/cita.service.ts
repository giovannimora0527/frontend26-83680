import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita } from 'src/app/models/cita';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio para consumir los endpoints de citas.
 */
@Injectable({
  providedIn: 'root'
})
export class CitaService {
  /** Ruta base del backend para las citas. */
  private api = `cita`;

  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista todas las citas (ya vienen de la más reciente a la más antigua).
   * @returns lista de citas.
   */
  listarCitas(): Observable<Cita[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Lista las citas de una mascota (para los combos dependientes).
   * @param mascotaId id de la mascota.
   * @returns citas de la mascota.
   */
  listarPorMascota(mascotaId: number): Observable<Cita[]> {
    const params = new HttpParams().set('mascotaId', mascotaId);
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar-by-mascota', params);
  }

  /**
   * Consulta una cita por id.
   * @param citaId id de la cita.
   * @returns la cita.
   */
  consultarCita(citaId: number): Observable<Cita> {
    const params = new HttpParams().set('citaId', citaId);
    return this.backendService.get(environment.apiUrlAuth, this.api, 'consultar', params);
  }

  /**
   * Crea una cita (POST).
   * @param cita datos de la cita.
   * @returns respuesta del backend.
   */
  crearCita(cita: Cita): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', cita);
  }

  /**
   * Actualiza una cita (PUT).
   * @param cita datos de la cita con su citaId.
   * @returns respuesta del backend.
   */
  actualizarCita(cita: Cita): Observable<MiRespuesta> {
    return this.backendService.put(environment.apiUrlAuth, this.api, 'actualizar', cita);
  }

  /**
   * Reactiva una cita cancelada (PUT).
   * @param citaId id de la cita.
   * @returns respuesta del backend.
   */
  reactivarCita(citaId: number): Observable<MiRespuesta> {
    const params = new HttpParams().set('citaId', citaId);
    return this.backendService.put(environment.apiUrlAuth, this.api, 'reactivar', {}, params);
  }
}
