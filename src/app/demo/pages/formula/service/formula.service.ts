import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { FiltroFormulas, Formula, FormulaRq } from 'src/app/models/formula';
import { Pagina } from 'src/app/models/pagina';
import { RespuestaApi } from 'src/app/models/respuesta-api';
import { BackendService } from 'src/app/services/backend.service';
import { aParametros } from 'src/app/utils/parametros';
import { environment } from 'src/environments/environment';

/** Servicio de Angular que consume la API REST de fórmulas médicas. */
@Injectable({
  providedIn: 'root'
})
export class FormulaService {
  /** Recurso del backend para las fórmulas. */
  private readonly api = 'formula';

  /**
   * @param backendService servicio genérico que arma y envía las peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) { }

  /**
   * Consulta una página de fórmulas con orden y filtros.
   *
   * @param filtro página, orden y filtros.
   * @returns página de fórmulas.
   */
  listar(filtro: FiltroFormulas): Observable<Pagina<Formula>> {
    return this.backendService.get<Pagina<Formula>>(environment.apiUrlAuth, this.api, 'listar', aParametros(filtro));
  }

  /**
   * Consulta el detalle de una fórmula con medicamentos, historial y entregas.
   *
   * @param formulaId número de la fórmula.
   * @returns la fórmula.
   */
  consultar(formulaId: number): Observable<Formula> {
    return this.backendService.get<Formula>(environment.apiUrlAuth, this.api, String(formulaId));
  }

  /**
   * Registra una fórmula como borrador o confirmada.
   *
   * @param formulaRq datos de la fórmula.
   * @returns mensaje de éxito.
   */
  guardar(formulaRq: FormulaRq): Observable<RespuestaApi> {
    return this.backendService.post<RespuestaApi>(environment.apiUrlAuth, this.api, 'guardar', formulaRq);
  }

  /**
   * Modifica una fórmula en borrador.
   *
   * @param formulaId número de la fórmula.
   * @param formulaRq nuevos datos.
   * @returns mensaje de éxito.
   */
  actualizar(formulaId: number, formulaRq: FormulaRq): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, String(formulaId), formulaRq);
  }

  /**
   * Confirma una fórmula en borrador y la envía a despacho.
   *
   * @param formulaId número de la fórmula.
   * @returns mensaje de éxito.
   */
  confirmar(formulaId: number): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `${formulaId}/confirmar`, {});
  }

  /**
   * Anula una fórmula sin entregas.
   *
   * @param formulaId número de la fórmula.
   * @param motivo motivo de la anulación.
   * @returns mensaje de éxito.
   */
  anular(formulaId: number, motivo: string): Observable<RespuestaApi> {
    return this.backendService.put<RespuestaApi>(environment.apiUrlAuth, this.api, `${formulaId}/anular`, { motivo });
  }

  /**
   * Descarga la fórmula en PDF.
   *
   * @param formulaId número de la fórmula.
   * @returns contenido del PDF.
   */
  descargarPdf(formulaId: number): Observable<Blob> {
    return this.backendService.getArchivo(environment.apiUrlAuth, this.api, `${formulaId}/pdf`);
  }
}
