import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita } from 'src/app/models/cita';
import { Horario } from 'src/app/models/clinica';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio de la agenda del medico autenticado (calendario).
 */
@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly url = environment.apiUrlAuth;

  constructor(private readonly backend: BackendService) { }

  /** @returns citas del medico en el rango del calendario. */
  misCitas(desde: string, hasta: string): Observable<Cita[]> {
    return this.backend.get(this.url, 'agenda', 'citas', new HttpParams().set('desde', desde).set('hasta', hasta));
  }

  /** @returns detalle de una cita propia. */
  consultar(citaId: number): Observable<Cita> {
    return this.backend.get(this.url, 'agenda', 'cita', new HttpParams().set('citaId', citaId));
  }

  /** @returns respuesta al crear una cita. */
  crear(cita: Cita): Observable<MiRespuesta> {
    return this.backend.post(this.url, 'agenda', 'cita', cita);
  }

  /** @returns respuesta al editar una cita. */
  actualizar(cita: Cita): Observable<MiRespuesta> {
    return this.backend.put(this.url, 'agenda', 'cita', cita);
  }

  /** @returns respuesta al mover una cita en el calendario. */
  reprogramar(citaId: number, fechaHora: string, fechaHoraFin: string): Observable<MiRespuesta> {
    return this.backend.put(this.url, 'agenda', 'reprogramar', { citaId, fechaHora, fechaHoraFin });
  }

  /** @returns respuesta al cambiar el estado. */
  cambiarEstado(citaId: number, estado: string): Observable<MiRespuesta> {
    return this.backend.put(this.url, 'agenda', 'estado', {}, new HttpParams().set('citaId', citaId).set('estado', estado));
  }

  /** @returns historial de citas de una mascota. */
  historialMascota(mascotaId: number): Observable<Cita[]> {
    return this.backend.get(this.url, 'agenda', 'historial-mascota', new HttpParams().set('mascotaId', mascotaId));
  }

  /** @returns horarios del medico. */
  misHorarios(): Observable<Horario[]> {
    return this.backend.get(this.url, 'agenda', 'horarios');
  }

  /** @returns Excel con las citas del medico. */
  reporteExcel(desde: string, hasta: string): Observable<Blob> {
    return this.backend.descargar(this.url, 'agenda', 'reporte-excel', new HttpParams().set('desde', desde).set('hasta', hasta));
  }
}
