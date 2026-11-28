import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface FormulaPendienteRs {
  formulaId: number;
  medicoNombre: string;
  propietarioNombre: string;
  propietarioDocumento: string;
  mascotaNombre: string;
  fechaFormula: string;
  estadoDespacho?: string;
  despachoId?: number;
  medicamentoNombre: string;
  medicamentoId: number;
  dosis: string;
  frecuencia: string;
  duracion: string;
  cantidad: string;
  viaAdministracion: string;
  indicaciones: string;
  lotesDisponibles?: LoteDisponibleRs[];
}

export interface LoteDisponibleRs {
  loteId: number;
  numeroLote: string;
  cantidadDisponible: number;
  fechaVencimiento: string;
  vencido: boolean;
  proximoAVencer: boolean;
}

export interface ConfirmarDespachoRq {
  formulaMedicaId: number;
  usuarioDespachoId: number;
  observaciones?: string;
  lineas: LineaDispensaRq[];
}

export interface LineaDispensaRq {
  formulaMedicaId: number;
  medicamentoId: number;
  loteId: number;
  cantidadEntregada: number;
}

export interface RevertirDespachoRq {
  usuarioId: number;
  motivo: string;
}

export interface Despacho {
  id?: number;
  formulaMedica?: any;
  usuarioDespacho?: any;
  fechaCreacion?: string;
  fechaDispensacion?: string;
  estado?: string;
  observaciones?: string;
}

export interface DetalleDespacho {
  id?: number;
  medicamento?: any;
  lote?: any;
  cantidadPrescrita?: number;
  cantidadEntregada?: number;
}

@Injectable({ providedIn: 'root' })
export class DespachoService {
  private api = 'despachos';

  constructor(private readonly backendService: BackendService) {}

  listarFormulasPendientes(filtros: { numeroFormula?: string; propietario?: string; mascota?: string; fecha?: string } = {}): Observable<FormulaPendienteRs[]> {
    let params = new HttpParams();
    if (filtros.numeroFormula) params = params.set('numeroFormula', filtros.numeroFormula);
    if (filtros.propietario) params = params.set('propietario', filtros.propietario);
    if (filtros.mascota) params = params.set('mascota', filtros.mascota);
    if (filtros.fecha) params = params.set('fecha', filtros.fecha);
    return this.backendService.get<FormulaPendienteRs[]>(environment.apiUrlAuth, this.api, 'formulas-pendientes', params);
  }

  obtenerDetalleFormula(formulaId: number): Observable<FormulaPendienteRs[]> {
    const params = new HttpParams().set('formulaId', formulaId);
    return this.backendService.get<FormulaPendienteRs[]>(environment.apiUrlAuth, this.api, 'detalle-formula', params);
  }

  listar(): Observable<Despacho[]> {
    return this.backendService.get<Despacho[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  listarDetalles(despachoId: number): Observable<DetalleDespacho[]> {
    const params = new HttpParams().set('despachoId', despachoId);
    return this.backendService.get<DetalleDespacho[]>(environment.apiUrlAuth, this.api, 'detalles', params);
  }

  listarHistorial(despachoId: number): Observable<any[]> {
    const params = new HttpParams().set('despachoId', despachoId);
    return this.backendService.get<any[]>(environment.apiUrlAuth, this.api, 'historial', params);
  }

  listarMovimientos(medicamentoId: number): Observable<any[]> {
    const params = new HttpParams().set('medicamentoId', medicamentoId);
    return this.backendService.get<any[]>(environment.apiUrlAuth, this.api, 'movimientos', params);
  }

  confirmarDispensa(rq: ConfirmarDespachoRq): Observable<any> {
    return this.backendService.post<any>(environment.apiUrlAuth, this.api, 'confirmar', rq);
  }

  revertir(despachoId: number, rq: RevertirDespachoRq): Observable<any> {
    return this.backendService.post<any>(environment.apiUrlAuth, this.api, `${despachoId}/revertir`, rq);
  }

  comprobantePdfUrl(despachoId: number): string {
    return `${environment.apiUrlAuth}/despachos/${despachoId}/comprobante-pdf`;
  }

  actualizarEstadoDirecto(despachoId: number, estado: string, usuarioId: number, observaciones?: string): Observable<any> {
    return this.backendService.post<any>(environment.apiUrlAuth, this.api, 'actualizar-estado', {
      formulasMedicaId: despachoId,
      usuarioDespachoId: usuarioId,
      estado,
      observaciones,
    });
  }

  crearDespachoConEstado(formulaMedicaId: number, usuarioId: number, estado: string, observaciones?: string): Observable<any> {
    return this.backendService.post<any>(environment.apiUrlAuth, this.api, 'crear', {
      formulasMedicaId: formulaMedicaId,
      usuarioDespachoId: usuarioId,
      estado,
      observaciones,
    });
  }
}
