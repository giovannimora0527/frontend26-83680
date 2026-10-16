import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { FormulaMedicaRq } from 'src/app/models/formula-medica-rq';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FormulaMedicaService {
  private api = `formula-medica`;

  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista las fórmulas médicas ordenadas por fecha de creación descendente.
   * @returns Observable con la lista de fórmulas.
   */
  listar(): Observable<FormulaMedica[]> {
    return this.backendService.get<FormulaMedica[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Consulta el detalle completo de una fórmula.
   * @param formulaId Identificador de la fórmula.
   * @returns Observable con la fórmula.
   */
  consultar(formulaId: number): Observable<FormulaMedica> {
    const params = new HttpParams().set('formulaId', formulaId);
    return this.backendService.get<FormulaMedica>(environment.apiUrlAuth, this.api, 'consultar', params);
  }

  /**
   * Crea una fórmula médica.
   * @param formulaRq Datos de la fórmula.
   * @returns Observable con la respuesta del backend.
   */
  guardar(formulaRq: FormulaMedicaRq): Observable<MiRespuesta> {
    return this.backendService.post<MiRespuesta>(environment.apiUrlAuth, this.api, 'guardar', formulaRq);
  }

  /**
   * Actualiza una fórmula médica.
   * @param formulaRq Datos de la fórmula.
   * @returns Observable con la respuesta del backend.
   */
  actualizar(formulaRq: FormulaMedicaRq): Observable<MiRespuesta> {
    return this.backendService.put<MiRespuesta>(environment.apiUrlAuth, this.api, 'actualizar', formulaRq);
  }

  /**
   * Inactiva una fórmula médica (no se elimina físicamente).
   * @param formulaId Identificador de la fórmula.
   * @returns Observable con la respuesta del backend.
   */
  inactivar(formulaId: number): Observable<MiRespuesta> {
    const params = new HttpParams().set('formulaId', formulaId);
    return this.backendService.patch<MiRespuesta>(environment.apiUrlAuth, this.api, 'inactivar', {}, params);
  }
}
