import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReporteFinancieroRS, ReporteGestionMedicaRS, ReporteInventarioRS } from 'src/app/models/reporte';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface ParametrosExportacionReporte {
  tipoReporte: 'FINANCIERO' | 'INVENTARIO' | 'MEDICO';
  fechaInicial?: string;
  fechaFinal?: string;
  medicoId?: number | null;
  especializacionId?: number | null;
  medicamentoId?: number | null;
  diasProximoVencer?: number;
  agrupacion?: 'DIA' | 'MES' | 'ANIO';
  rol?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private api = `reporte`;

  constructor(private readonly backendService: BackendService) { }

  obtenerReporteFinanciero(filtros?: {
    fechaInicial?: string;
    fechaFinal?: string;
    medicoId?: number | null;
    especializacionId?: number | null;
    rol?: string;
  }): Observable<ReporteFinancieroRS> {
    let params = new HttpParams();
    if (filtros?.fechaInicial) {
      params = params.set('fechaInicial', filtros.fechaInicial);
    }
    if (filtros?.fechaFinal) {
      params = params.set('fechaFinal', filtros.fechaFinal);
    }
    if (filtros?.medicoId) {
      params = params.set('medicoId', filtros.medicoId);
    }
    if (filtros?.especializacionId) {
      params = params.set('especializacionId', filtros.especializacionId);
    }
    if (filtros?.rol) {
      params = params.set('rol', filtros.rol);
    }
    return this.backendService.get<ReporteFinancieroRS>(environment.apiUrlAuth, this.api, 'financiero', params);
  }

  obtenerReporteInventario(filtros?: {
    fechaInicial?: string;
    fechaFinal?: string;
    medicamentoId?: number | null;
    diasProximoVencer?: number;
    rol?: string;
  }): Observable<ReporteInventarioRS> {
    let params = new HttpParams();
    if (filtros?.fechaInicial) {
      params = params.set('fechaInicial', filtros.fechaInicial);
    }
    if (filtros?.fechaFinal) {
      params = params.set('fechaFinal', filtros.fechaFinal);
    }
    if (filtros?.medicamentoId) {
      params = params.set('medicamentoId', filtros.medicamentoId);
    }
    if (filtros?.diasProximoVencer) {
      params = params.set('diasProximoVencer', filtros.diasProximoVencer);
    }
    if (filtros?.rol) {
      params = params.set('rol', filtros.rol);
    }
    return this.backendService.get<ReporteInventarioRS>(environment.apiUrlAuth, this.api, 'inventario', params);
  }

  obtenerReporteGestionMedica(filtros?: {
    fechaInicial?: string;
    fechaFinal?: string;
    medicoId?: number | null;
    especializacionId?: number | null;
    rol?: string;
  }): Observable<ReporteGestionMedicaRS> {
    let params = new HttpParams();
    if (filtros?.fechaInicial) {
      params = params.set('fechaInicial', filtros.fechaInicial);
    }
    if (filtros?.fechaFinal) {
      params = params.set('fechaFinal', filtros.fechaFinal);
    }
    if (filtros?.medicoId) {
      params = params.set('medicoId', filtros.medicoId);
    }
    if (filtros?.especializacionId) {
      params = params.set('especializacionId', filtros.especializacionId);
    }
    if (filtros?.rol) {
      params = params.set('rol', filtros.rol);
    }
    return this.backendService.get<ReporteGestionMedicaRS>(environment.apiUrlAuth, this.api, 'gestion-medica', params);
  }

  exportarExcel(filtros: ParametrosExportacionReporte): Observable<Blob> {
    return this.backendService.getBlob(
      environment.apiUrlAuth,
      this.api,
      'exportar-excel',
      this.construirParamsExportacion(filtros)
    );
  }

  exportarPdf(filtros: ParametrosExportacionReporte): Observable<Blob> {
    return this.backendService.getBlob(
      environment.apiUrlAuth,
      this.api,
      'exportar-pdf',
      this.construirParamsExportacion(filtros)
    );
  }

  private construirParamsExportacion(filtros: ParametrosExportacionReporte): HttpParams {
    let params = new HttpParams().set('tipoReporte', filtros.tipoReporte);
    if (filtros.fechaInicial) {
      params = params.set('fechaInicial', filtros.fechaInicial);
    }
    if (filtros.fechaFinal) {
      params = params.set('fechaFinal', filtros.fechaFinal);
    }
    if (filtros.medicoId) {
      params = params.set('medicoId', filtros.medicoId);
    }
    if (filtros.especializacionId) {
      params = params.set('especializacionId', filtros.especializacionId);
    }
    if (filtros.medicamentoId) {
      params = params.set('medicamentoId', filtros.medicamentoId);
    }
    if (filtros.diasProximoVencer) {
      params = params.set('diasProximoVencer', filtros.diasProximoVencer);
    }
    if (filtros.agrupacion) {
      params = params.set('agrupacion', filtros.agrupacion);
    }
    if (filtros.rol) {
      params = params.set('rol', filtros.rol);
    }
    return params;
  }
}
