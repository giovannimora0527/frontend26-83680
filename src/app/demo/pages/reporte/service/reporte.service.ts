import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reporte, TipoReporte } from 'src/app/models/clinica';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/** Filtros de un reporte. */
export interface FiltroReporte {
  tipo: string;
  desde: string;
  hasta: string;
  agrupacion?: string;
  filtro?: string;
}

/**
 * Servicio de reportes.
 */
@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly url = environment.apiUrlAuth;

  constructor(private readonly backend: BackendService) { }

  /** @returns tipos de reporte. */
  tipos(): Observable<TipoReporte[]> {
    return this.backend.get(this.url, 'reporte', 'tipos');
  }

  /** @returns datos para la vista previa. */
  datos(f: FiltroReporte): Observable<Reporte> {
    return this.backend.get(this.url, 'reporte', 'datos', this.params(f));
  }

  /** @returns archivo Excel. */
  excel(f: FiltroReporte): Observable<Blob> {
    return this.backend.descargar(this.url, 'reporte', 'excel', this.params(f));
  }

  /** @returns archivo PDF. */
  pdf(f: FiltroReporte): Observable<Blob> {
    return this.backend.descargar(this.url, 'reporte', 'pdf', this.params(f));
  }

  private params(f: FiltroReporte): HttpParams {
    let p = new HttpParams().set('tipo', f.tipo).set('desde', f.desde).set('hasta', f.hasta);
    if (f.agrupacion) { p = p.set('agrupacion', f.agrupacion); }
    if (f.filtro) { p = p.set('filtro', f.filtro); }
    return p;
  }
}
