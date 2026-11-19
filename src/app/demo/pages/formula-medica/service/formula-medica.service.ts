import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { FormulaMedicaRq } from 'src/app/models/formula-medica-rq';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { MovimientoMedicamento } from 'src/app/models/movimiento-medicamento';
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
   * Lista las fórmulas médicas asociadas a una cita o atención médica específica.
   * @param citaId Identificador de la cita.
   * @returns Observable con las fórmulas de la cita.
   */
  listarPorCita(citaId: number): Observable<FormulaMedica[]> {
    const params = new HttpParams().set('citaId', citaId);
    return this.backendService.get<FormulaMedica[]>(environment.apiUrlAuth, this.api, 'listar-by-cita', params);
  }

  /**
   * Lista las fórmulas médicas asociadas a una mascota.
   * @param mascotaId Identificador de la mascota.
   * @returns Observable con las fórmulas de la mascota.
   */
  listarPorMascota(mascotaId: number): Observable<FormulaMedica[]> {
    const params = new HttpParams().set('mascotaId', mascotaId);
    return this.backendService.get<FormulaMedica[]>(environment.apiUrlAuth, this.api, 'listar-by-mascota', params);
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
   * Crea una fórmula médica (valida stock sin descontarlo).
   * @param formulaRq Datos de la fórmula.
   * @returns Observable con la respuesta del backend.
   */
  guardar(formulaRq: FormulaMedicaRq): Observable<MiRespuesta> {
    return this.backendService.post<MiRespuesta>(environment.apiUrlAuth, this.api, 'guardar', formulaRq);
  }

  /**
   * Actualiza una fórmula médica activa.
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

  /**
   * Registra la dispensación (total o parcial) de una fórmula médica y descuenta las unidades del inventario.
   * @param formulaId Identificador de la fórmula.
   * @param cantidad Cantidad a dispensar.
   * @param observacion Observación opcional de la entrega.
   * @param usuario Usuario responsable que realiza la dispensación.
   * @returns Observable con la respuesta del backend.
   */
  dispensar(formulaId: number, cantidad: number, observacion?: string, usuario?: string): Observable<MiRespuesta> {
    let params = new HttpParams().set('cantidad', cantidad);
    if (observacion && observacion.trim()) {
      params = params.set('observacion', observacion.trim());
    }
    if (usuario && usuario.trim()) {
      params = params.set('usuario', usuario.trim());
    }
    return this.backendService.post<MiRespuesta>(
      environment.apiUrlAuth,
      this.api,
      `${formulaId}/dispensar?${params.toString()}`,
      {}
    );
  }

  /**
   * Consulta el historial de salidas de inventario vinculadas a una fórmula médica.
   * @param formulaId Identificador de la fórmula.
   * @returns Observable con la lista de movimientos.
   */
  consultarHistorial(formulaId: number): Observable<MovimientoMedicamento[]> {
    return this.backendService.get<MovimientoMedicamento[]>(
      environment.apiUrlAuth,
      this.api,
      `${formulaId}/historial`
    );
  }
}
