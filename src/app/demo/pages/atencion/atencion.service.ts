import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AtencionInfo, AtencionRq, AtencionRs } from 'src/app/models/clinica';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio de la atencion medica de una cita.
 */
@Injectable({ providedIn: 'root' })
export class AtencionService {
  private readonly url = environment.apiUrlAuth;

  constructor(private readonly backend: BackendService) { }

  /** @returns datos para atender la cita. */
  consultar(citaId: number): Observable<AtencionInfo> {
    return this.backend.get(this.url, 'atencion', 'cita', new HttpParams().set('citaId', citaId));
  }

  /** @returns resultado al finalizar la atencion. */
  finalizar(rq: AtencionRq): Observable<AtencionRs> {
    return this.backend.post(this.url, 'atencion', 'finalizar', rq);
  }

  /** @returns PDF de la prefactura. */
  prefactura(citaId: number): Observable<Blob> {
    return this.backend.descargar(this.url, 'atencion', 'prefactura-pdf', new HttpParams().set('citaId', citaId));
  }

  /** @returns PDF de la formula. */
  formulaPdf(formulaId: number): Observable<Blob> {
    return this.backend.descargar(this.url, 'atencion', 'formula-pdf', new HttpParams().set('formulaId', formulaId));
  }
}
