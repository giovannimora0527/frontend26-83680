import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio para consumir los endpoints de fórmulas médicas.
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
   * Consulta el detalle de una fórmula.
   * @param formulaId id de la fórmula.
   * @returns la fórmula.
   */
  consultarFormula(formulaId: number): Observable<FormulaMedica> {
    const params = new HttpParams().set('formulaId', formulaId);
    return this.backendService.get(environment.apiUrlAuth, this.api, 'consultar', params);
  }

  /**
   * Crea una fórmula (POST).
   * @param formula datos de la fórmula.
   * @returns respuesta del backend.
   */
  crearFormula(formula: FormulaMedica): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', formula);
  }

  /**
   * Actualiza una fórmula (PUT).
   * @param formula datos de la fórmula con su formulaId.
   * @returns respuesta del backend.
   */
  actualizarFormula(formula: FormulaMedica): Observable<MiRespuesta> {
    return this.backendService.put(environment.apiUrlAuth, this.api, 'actualizar', formula);
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
}
