import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BloqueoHorario } from 'src/app/models/bloqueo-horario';
import { Cita } from 'src/app/models/cita';
import { CitaRq } from 'src/app/models/cita-rq';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface FiltroCitas {
  medicoId?: number | null;
  fechaInicial?: string;
  fechaFinal?: string;
  estado?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private api = `cita`;

  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista las citas aplicando filtros opcionales de veterinario, rango de fechas y estado.
   * @param filtros Filtros opcionales para el calendario o tabla.
   * @returns Observable con la lista de citas.
   */
  listar(filtros?: FiltroCitas): Observable<Cita[]> {
    const params = this.construirParamsFiltro(filtros);
    return this.backendService.get<Cita[]>(environment.apiUrlAuth, this.api, 'listar', params);
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
   * Lista las citas de una mascota (historial de citas de la mascota y combos de historia/fórmula).
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
   * Marca una cita como atendida directamente.
   * @param citaId Identificador de la cita.
   * @param usuarioCambio Perfil o usuario que realiza el cambio.
   * @returns Observable con la respuesta del backend.
   */
  atender(citaId: number, usuarioCambio?: string): Observable<MiRespuesta> {
    let params = new HttpParams().set('citaId', citaId);
    if (usuarioCambio) {
      params = params.set('usuarioCambio', usuarioCambio);
    }
    return this.backendService.patch<MiRespuesta>(environment.apiUrlAuth, this.api, 'atender', {}, params);
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

  /**
   * Exporta a Excel (.xlsx) las citas según los filtros de veterinario, rango de fechas y estado.
   * @param filtros Filtros aplicados.
   * @returns Observable con el archivo Blob.
   */
  exportarExcel(filtros?: FiltroCitas): Observable<Blob> {
    const params = this.construirParamsFiltro(filtros);
    return this.backendService.getBlob(environment.apiUrlAuth, this.api, 'exportar-excel', params);
  }

  /**
   * Lista los bloqueos de horario activos, opcionalmente filtrados por veterinario.
   * @param medicoId Identificador del veterinario (opcional).
   * @returns Observable con los bloqueos activos.
   */
  listarBloqueos(medicoId?: number | null): Observable<BloqueoHorario[]> {
    let params = new HttpParams();
    if (medicoId) {
      params = params.set('medicoId', medicoId);
    }
    return this.backendService.get<BloqueoHorario[]>(environment.apiUrlAuth, this.api, 'bloqueos', params);
  }

  /**
   * Registra un nuevo bloqueo de horario para un veterinario.
   * @param bloqueo Datos del bloqueo.
   * @returns Observable con la respuesta del backend.
   */
  guardarBloqueo(bloqueo: BloqueoHorario): Observable<MiRespuesta> {
    return this.backendService.post<MiRespuesta>(environment.apiUrlAuth, this.api, 'bloqueos/guardar', bloqueo);
  }

  /**
   * Inactiva un bloqueo de horario existente.
   * @param bloqueoId Identificador del bloqueo.
   * @returns Observable con la respuesta del backend.
   */
  inactivarBloqueo(bloqueoId: number): Observable<MiRespuesta> {
    const params = new HttpParams().set('bloqueoId', bloqueoId);
    return this.backendService.patch<MiRespuesta>(environment.apiUrlAuth, this.api, 'bloqueos/inactivar', {}, params);
  }

  private construirParamsFiltro(filtros?: FiltroCitas): HttpParams {
    let params = new HttpParams();
    if (!filtros) {
      return params;
    }
    if (filtros.medicoId) {
      params = params.set('medicoId', filtros.medicoId);
    }
    if (filtros.fechaInicial) {
      params = params.set('fechaInicial', filtros.fechaInicial);
    }
    if (filtros.fechaFinal) {
      params = params.set('fechaFinal', filtros.fechaFinal);
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    return params;
  }
}
