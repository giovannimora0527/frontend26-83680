import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpParams } from '@angular/common/http';

import { Cita, CitaHistorial, CitaRq, EstadoCitaInfo, FiltroCitas, HorarioMedico } from 'src/app/models/cita';
import { Pagina } from 'src/app/models/pagina';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { aParametros } from 'src/app/utils/parametros';
import { environment } from 'src/environments/environment';

/**
 * Servicio de Angular que consume la API REST de citas. Los catálogos del
 * formulario (clientes, mascotas, veterinarios) están en CatalogoService.
 */
@Injectable({
  providedIn: 'root'
})
export class CitaService {
  /** Recurso del backend para las citas. */
  private readonly api = 'cita';

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /**
   * Consulta una página de citas aplicando orden y filtros en el backend.
   *
   * @param filtro página, orden y filtros elegidos por el usuario.
   * @returns página de citas.
   */
  listar(filtro: FiltroCitas): Observable<Pagina<Cita>> {
    return this.backendService.get<Pagina<Cita>>(environment.apiUrlAuth, this.api, 'listar', aParametros(filtro));
  }

  /**
   * Consulta el detalle de una cita.
   *
   * @param citaId identificador de la cita.
   * @returns la cita encontrada.
   */
  consultar(citaId: number): Observable<Cita> {
    return this.backendService.get<Cita>(environment.apiUrlAuth, this.api, String(citaId));
  }

  /**
   * Registra una cita nueva.
   *
   * @param citaRq datos de la cita.
   * @returns mensaje de éxito.
   */
  guardar(citaRq: CitaRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.api, 'guardar', citaRq);
  }

  /**
   * Modifica una cita existente (PUT).
   *
   * @param citaId identificador de la cita.
   * @param citaRq nuevos datos.
   * @returns mensaje de éxito.
   */
  actualizar(citaId: number, citaRq: CitaRq): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, String(citaId), citaRq);
  }

  /**
   * Reactiva una cita cancelada (operación explícita).
   *
   * @param citaId identificador de la cita cancelada.
   * @returns mensaje de éxito.
   */
  reactivar(citaId: number): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `${citaId}/reactivar`, {});
  }

  /**
   * Citas de un rango para el calendario (el veterinario recibe solo las suyas).
   *
   * @param desde fecha inicial (yyyy-MM-dd).
   * @param hasta fecha final incluida (yyyy-MM-dd).
   * @param medicoId veterinario (opcional).
   */
  calendario(desde: string, hasta: string, medicoId?: number | null): Observable<Cita[]> {
    return this.backendService.get<Cita[]>(environment.apiUrlAuth, this.api, 'calendario',
      aParametros({ desde, hasta, medicoId }));
  }

  /**
   * Cambia el estado de una cita (confirmar, atender o cancelar con motivo).
   */
  cambiarEstado(citaId: number, estado: string, motivo?: string): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `${citaId}/estado`, { estado, motivo });
  }

  /**
   * Cambia la fecha y hora de una cita.
   */
  reprogramar(citaId: number, fecha: string, hora: string, horaFin: string | null, observacion?: string): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `${citaId}/reprogramar`,
      { fecha, hora, horaFin, observacion });
  }

  /**
   * Historial de cambios de una cita.
   */
  historial(citaId: number): Observable<CitaHistorial[]> {
    return this.backendService.get<CitaHistorial[]>(environment.apiUrlAuth, this.api, `${citaId}/historial`);
  }

  /**
   * Catálogo de estados con su color.
   */
  estados(): Observable<EstadoCitaInfo[]> {
    return this.backendService.get<EstadoCitaInfo[]>(environment.apiUrlAuth, this.api, 'estados');
  }

  /**
   * Reporte de citas en Excel.
   */
  descargarExcel(desde: string, hasta: string, medicoId?: number | null, estado?: string): Observable<Blob> {
    return this.backendService.getArchivo(environment.apiUrlAuth, this.api, 'reporte/excel',
      aParametros({ desde, hasta, medicoId, estado }));
  }

  /**
   * Horario semanal de un veterinario.
   */
  horarios(medicoId: number): Observable<HorarioMedico[]> {
    return this.backendService.get<HorarioMedico[]>(environment.apiUrlAuth, 'medico', `${medicoId}/horarios`);
  }

  /**
   * Historial de citas de una mascota (todas, de la más reciente a la más antigua).
   */
  historialMascota(mascotaId: number): Observable<Cita[]> {
    const params = new HttpParams().set('mascotaId', mascotaId).set('size', 100).set('orden', 'fecha').set('direccion', 'desc');
    return new Observable<Cita[]>((obs) => {
      const sub = this.backendService.get<{ content: Cita[] }>(environment.apiUrlAuth, this.api, 'listar', params)
        .subscribe({ next: (p) => { obs.next(p.content); obs.complete(); }, error: (e) => obs.error(e) });
      return () => sub.unsubscribe();
    });
  }
}

