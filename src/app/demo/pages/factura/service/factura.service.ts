import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Factura, PreliquidacionFactura } from 'src/app/models/factura';
import { FacturaRq, PagoFacturaRq } from 'src/app/models/factura-rq';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private api = `factura`;

  constructor(private readonly backendService: BackendService) { }

  listar(filtros?: {
    clienteId?: number | null;
    mascotaId?: number | null;
    estado?: string;
    fechaInicial?: string;
    fechaFinal?: string;
  }): Observable<Factura[]> {
    let params = new HttpParams();
    if (filtros?.clienteId) {
      params = params.set('clienteId', filtros.clienteId);
    }
    if (filtros?.mascotaId) {
      params = params.set('mascotaId', filtros.mascotaId);
    }
    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros?.fechaInicial) {
      params = params.set('fechaInicial', filtros.fechaInicial);
    }
    if (filtros?.fechaFinal) {
      params = params.set('fechaFinal', filtros.fechaFinal);
    }
    return this.backendService.get<Factura[]>(environment.apiUrlAuth, this.api, 'listar', params);
  }

  consultar(facturaId: number): Observable<Factura> {
    const params = new HttpParams().set('facturaId', facturaId);
    return this.backendService.get<Factura>(environment.apiUrlAuth, this.api, 'consultar', params);
  }

  preliquidarCita(citaId: number): Observable<PreliquidacionFactura> {
    const params = new HttpParams().set('citaId', citaId);
    return this.backendService.get<PreliquidacionFactura>(environment.apiUrlAuth, this.api, 'preliquidar', params);
  }

  historialPorCliente(clienteId: number): Observable<Factura[]> {
    const params = new HttpParams().set('clienteId', clienteId);
    return this.backendService.get<Factura[]>(environment.apiUrlAuth, this.api, 'historial-cliente', params);
  }

  historialPorMascota(mascotaId: number): Observable<Factura[]> {
    const params = new HttpParams().set('mascotaId', mascotaId);
    return this.backendService.get<Factura[]>(environment.apiUrlAuth, this.api, 'historial-mascota', params);
  }

  guardar(facturaRq: FacturaRq): Observable<MiRespuesta> {
    return this.backendService.post<MiRespuesta>(environment.apiUrlAuth, this.api, 'guardar', facturaRq);
  }

  registrarPago(facturaId: number, pagoRq: PagoFacturaRq): Observable<MiRespuesta> {
    return this.backendService.post<MiRespuesta>(environment.apiUrlAuth, this.api, `${facturaId}/pagos`, pagoRq);
  }

  anular(facturaId: number, motivo: string, usuario?: string): Observable<MiRespuesta> {
    let params = new HttpParams().set('motivo', motivo);
    if (usuario && usuario.trim()) {
      params = params.set('usuario', usuario.trim());
    }
    return this.backendService.patch<MiRespuesta>(environment.apiUrlAuth, this.api, `${facturaId}/anular`, {}, params);
  }
}
