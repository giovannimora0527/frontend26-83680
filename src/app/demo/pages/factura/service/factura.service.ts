import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita } from 'src/app/models/cita';
import { Factura } from 'src/app/models/clinica';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio de facturacion.
 */
@Injectable({ providedIn: 'root' })
export class FacturaService {
  private readonly url = environment.apiUrlAuth;

  constructor(private readonly backend: BackendService) { }

  /** @returns citas atendidas sin facturar. */
  porFacturar(): Observable<Cita[]> {
    return this.backend.get(this.url, 'factura', 'por-facturar');
  }

  /** @returns vista previa. */
  previsualizar(citaId: number): Observable<Factura> {
    return this.backend.get(this.url, 'factura', 'previsualizar', new HttpParams().set('citaId', citaId));
  }

  /** @returns factura generada. */
  generar(citaId: number, descuento: number): Observable<Factura> {
    return this.backend.post(this.url, 'factura', 'generar', { citaId, descuento });
  }

  /** @returns historial de facturas. */
  listar(filtros: { clienteId?: number | null; mascotaId?: number | null; estado?: string }): Observable<Factura[]> {
    let params = new HttpParams();
    if (filtros.clienteId) { params = params.set('clienteId', filtros.clienteId); }
    if (filtros.mascotaId) { params = params.set('mascotaId', filtros.mascotaId); }
    if (filtros.estado) { params = params.set('estado', filtros.estado); }
    return this.backend.get(this.url, 'factura', 'listar', params);
  }

  /** @returns factura con pagos y log. */
  consultar(facturaId: number): Observable<Factura> {
    return this.backend.get(this.url, 'factura', 'consultar', new HttpParams().set('facturaId', facturaId));
  }

  /** @returns respuesta al registrar un pago. */
  pagar(pago: { facturaId: number; valor: number; metodo: string; referencia?: string }): Observable<MiRespuesta> {
    return this.backend.post(this.url, 'factura', 'pago', pago);
  }

  /** @returns respuesta al anular. */
  anular(facturaId: number, motivo: string): Observable<MiRespuesta> {
    return this.backend.put(this.url, 'factura', 'anular', {}, new HttpParams().set('facturaId', facturaId).set('motivo', motivo));
  }

  /** @returns PDF de la factura. */
  pdf(facturaId: number): Observable<Blob> {
    return this.backend.descargar(this.url, 'factura', 'pdf', new HttpParams().set('facturaId', facturaId));
  }
}
