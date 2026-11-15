import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { FiltroReporte, Reporte, ReporteDef } from 'src/app/models/reporte';
import { BackendService } from 'src/app/services/backend.service';
import { aParametros } from 'src/app/utils/parametros';
import { environment } from 'src/environments/environment';

/** Servicio de Angular para los reportes. */
@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  /** Recurso del backend. */
  private readonly api = 'reporte';

  /**
   * @param backend servicio genérico de peticiones HTTP.
   */
  constructor(private readonly backend: BackendService) { }

  /** Reportes disponibles para el perfil de la sesión. */
  catalogo(): Observable<ReporteDef[]> {
    return this.backend.get<ReporteDef[]>(environment.apiUrlAuth, this.api, 'catalogo');
  }

  /** Vista previa de un reporte. */
  generar(codigo: string, filtro: FiltroReporte): Observable<Reporte> {
    return this.backend.get<Reporte>(environment.apiUrlAuth, this.api, codigo, aParametros(filtro));
  }

  /** Reporte en PDF o Excel. */
  descargar(codigo: string, formato: 'pdf' | 'excel', filtro: FiltroReporte): Observable<Blob> {
    return this.backend.getArchivo(environment.apiUrlAuth, this.api, `${codigo}/${formato}`, aParametros(filtro));
  }
}
