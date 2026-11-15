import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  DespachoRq,
  FiltroHistorialDespacho,
  FiltroPendientes,
  PreparacionDespacho
} from 'src/app/models/despacho';
import { Despacho, Formula } from 'src/app/models/formula';
import { Pagina } from 'src/app/models/pagina';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { aParametros } from 'src/app/utils/parametros';
import { environment } from 'src/environments/environment';

/** Servicio de Angular que consume la API REST del despacho de medicamentos. */
@Injectable({
  providedIn: 'root'
})
export class DespachoService {
  /** Recurso del backend. */
  private readonly api = 'despacho';

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /** Fórmulas confirmadas con medicamentos por entregar. */
  listarPendientes(filtro: FiltroPendientes): Observable<Pagina<Formula>> {
    return this.backendService.get<Pagina<Formula>>(environment.apiUrlAuth, this.api, 'pendientes', aParametros(filtro));
  }

  /** Lo pendiente por línea y los lotes sugeridos. */
  consultarPreparacion(formulaId: number): Observable<PreparacionDespacho> {
    return this.backendService.get<PreparacionDespacho>(environment.apiUrlAuth, this.api, `formula/${formulaId}`);
  }

  /** Marca la fórmula como en preparación. */
  iniciarPreparacion(formulaId: number): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `formula/${formulaId}/preparar`, {});
  }

  /** Confirma una entrega total o parcial. */
  entregar(formulaId: number, rq: DespachoRq): Observable<Despacho> {
    return this.backendService.post<Despacho>(environment.apiUrlAuth, this.api, `formula/${formulaId}/entregar`, rq);
  }

  /** Marca la fórmula como pendiente por disponibilidad. */
  sinDisponibilidad(formulaId: number, motivo: string): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api,
      `formula/${formulaId}/sin-disponibilidad`, { motivo });
  }

  /** Cancela el despacho de una fórmula sin entregas. */
  cancelar(formulaId: number, motivo: string): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `formula/${formulaId}/cancelar`, { motivo });
  }

  /** Revierte una entrega confirmada. */
  revertir(despachoId: number, motivo: string): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `${despachoId}/revertir`, { motivo });
  }

  /** Historial de entregas. */
  historial(filtro: FiltroHistorialDespacho): Observable<Pagina<Despacho>> {
    return this.backendService.get<Pagina<Despacho>>(environment.apiUrlAuth, this.api, 'historial', aParametros(filtro));
  }

  /** Comprobante de una entrega en PDF. */
  descargarComprobante(despachoId: number): Observable<Blob> {
    return this.backendService.getArchivo(environment.apiUrlAuth, this.api, `${despachoId}/comprobante`);
  }
}
