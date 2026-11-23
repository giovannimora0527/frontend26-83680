import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Despacho, DespachoFormula, LoteCantidad } from 'src/app/models/clinica';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio del despacho de medicamentos.
 */
@Injectable({ providedIn: 'root' })
export class DespachoService {
  private readonly url = environment.apiUrlAuth;

  constructor(private readonly backend: BackendService) { }

  /** @returns formulas pendientes. */
  pendientes(buscar: string, fecha: string): Observable<FormulaMedica[]> {
    let params = new HttpParams();
    if (buscar) { params = params.set('buscar', buscar); }
    if (fecha) { params = params.set('fecha', fecha); }
    return this.backend.get(this.url, 'despacho', 'pendientes', params);
  }

  /** @returns detalle para despachar. */
  formula(formulaId: number): Observable<DespachoFormula> {
    return this.backend.get(this.url, 'despacho', 'formula', new HttpParams().set('formulaId', formulaId));
  }

  /** @returns respuesta al iniciar preparacion. */
  preparar(formulaId: number): Observable<MiRespuesta> {
    return this.backend.put(this.url, 'despacho', 'preparar', {}, new HttpParams().set('formulaId', formulaId));
  }

  /** @returns respuesta al confirmar la entrega. */
  confirmar(rq: { formulaId: number; observacion?: string;
    items: { formulaDetalleId: number; cantidad: number; lotes: LoteCantidad[] }[] }): Observable<MiRespuesta> {
    return this.backend.post(this.url, 'despacho', 'confirmar', rq);
  }

  /** @returns respuesta al marcar sin disponibilidad. */
  sinDisponibilidad(formulaId: number, observacion: string): Observable<MiRespuesta> {
    return this.backend.put(this.url, 'despacho', 'sin-disponibilidad', {},
      new HttpParams().set('formulaId', formulaId).set('observacion', observacion));
  }

  /** @returns respuesta al cancelar. */
  cancelar(formulaId: number, motivo: string): Observable<MiRespuesta> {
    return this.backend.put(this.url, 'despacho', 'cancelar', {}, new HttpParams().set('formulaId', formulaId).set('motivo', motivo));
  }

  /** @returns respuesta al revertir (administrador). */
  revertir(despachoId: number, motivo: string): Observable<MiRespuesta> {
    return this.backend.put(this.url, 'despacho', 'revertir', {}, new HttpParams().set('despachoId', despachoId).set('motivo', motivo));
  }

  /** @returns historial de despachos. */
  historial(desde: string, hasta: string): Observable<Despacho[]> {
    return this.backend.get(this.url, 'despacho', 'historial', new HttpParams().set('desde', desde).set('hasta', hasta));
  }

  /** @returns comprobante PDF. */
  comprobante(despachoId: number): Observable<Blob> {
    return this.backend.descargar(this.url, 'despacho', 'comprobante-pdf', new HttpParams().set('despachoId', despachoId));
  }
}
