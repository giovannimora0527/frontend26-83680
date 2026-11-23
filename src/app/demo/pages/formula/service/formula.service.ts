import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio de consulta de fórmulas médicas (se crean desde la atención de la cita).
 */
@Injectable({
  providedIn: 'root'
})
export class FormulaService {
  /** Ruta base del backend para las fórmulas. */
  private api = `formula-medica`;

  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista las fórmulas (de la más reciente a la más antigua).
   * @returns lista de fórmulas.
   */
  listarFormulas(): Observable<FormulaMedica[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Consulta el detalle de una fórmula con sus medicamentos.
   * @param formulaId id de la fórmula.
   * @returns la fórmula.
   */
  consultarFormula(formulaId: number): Observable<FormulaMedica> {
    const params = new HttpParams().set('formulaId', formulaId);
    return this.backendService.get(environment.apiUrlAuth, this.api, 'consultar', params);
  }

  /**
   * Inactiva una fórmula (PATCH). No se borra porque es información clínica.
   * @param formulaId id de la fórmula.
   * @returns respuesta del backend.
   */
  inactivarFormula(formulaId: number): Observable<MiRespuesta> {
    const params = new HttpParams().set('formulaId', formulaId);
    return this.backendService.patch(environment.apiUrlAuth, this.api, 'inactivar', {}, params);
  }

  /**
   * Descarga la fórmula en PDF.
   * @param formulaId id de la fórmula.
   * @returns archivo PDF.
   */
  pdf(formulaId: number): Observable<Blob> {
    const params = new HttpParams().set('formulaId', formulaId);
    return this.backendService.descargar(environment.apiUrlAuth, this.api, 'pdf', params);
  }
}
