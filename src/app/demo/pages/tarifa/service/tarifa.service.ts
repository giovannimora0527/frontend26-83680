import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Especialidad, Tarifa, TarifaLog } from 'src/app/models/clinica';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio de especialidades y tarifas.
 */
@Injectable({ providedIn: 'root' })
export class TarifaService {
  private readonly url = environment.apiUrlAuth;

  constructor(private readonly backend: BackendService) { }

  /** @returns tarifas. */
  listar(): Observable<Tarifa[]> {
    return this.backend.get(this.url, 'tarifa', 'listar');
  }

  /** @returns respuesta al crear. */
  guardar(t: Tarifa): Observable<MiRespuesta> {
    return this.backend.post(this.url, 'tarifa', 'guardar', t);
  }

  /** @returns respuesta al editar. */
  actualizar(t: Tarifa): Observable<MiRespuesta> {
    return this.backend.put(this.url, 'tarifa', 'actualizar', t);
  }

  /** @returns respuesta al activar o inactivar. */
  cambiarEstado(id: number, activo: boolean): Observable<MiRespuesta> {
    return this.backend.patch(this.url, 'tarifa', 'estado', {}, new HttpParams().set('id', id).set('activo', activo));
  }

  /** @returns historial de cambios. */
  log(tarifaId: number): Observable<TarifaLog[]> {
    return this.backend.get(this.url, 'tarifa', 'log', new HttpParams().set('tarifaId', tarifaId));
  }

  /** @returns especialidades. */
  especialidades(): Observable<Especialidad[]> {
    return this.backend.get(this.url, 'especializacion', 'listar');
  }

  /** @returns respuesta al crear especialidad. */
  guardarEspecialidad(e: Especialidad): Observable<MiRespuesta> {
    return this.backend.post(this.url, 'especializacion', 'guardar', e);
  }

  /** @returns respuesta al editar especialidad. */
  actualizarEspecialidad(e: Especialidad): Observable<MiRespuesta> {
    return this.backend.put(this.url, 'especializacion', 'actualizar', e);
  }

  /** @returns respuesta al activar o inactivar especialidad. */
  estadoEspecialidad(id: number, activo: boolean): Observable<MiRespuesta> {
    return this.backend.patch(this.url, 'especializacion', 'estado', {}, new HttpParams().set('id', id).set('activo', activo));
  }
}
