import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medico, MedicoRq } from 'src/app/models/medico';
import { Especializacion } from 'src/app/models/especializacion';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio para consumir los endpoints de medicos y especializaciones.
 */
@Injectable({
  providedIn: 'root'
})
export class MedicoService {

  /** Ruta base del backend para los medicos. */
  private api = `medico`;

  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista todos los medicos.
   * @returns lista de medicos.
   */
  listar(): Observable<Medico[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }

  /**
   * Crea un medico (POST).
   * @param medico datos del medico.
   * @returns respuesta del backend.
   */
  crearMedico(medico: MedicoRq): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', medico);
  }

  /**
   * Actualiza un medico (PUT).
   * @param medico datos del medico con su medicoId.
   * @returns respuesta del backend.
   */
  actualizarMedico(medico: MedicoRq): Observable<MiRespuesta> {
    return this.backendService.put(environment.apiUrlAuth, this.api, 'actualizar', medico);
  }

  /**
   * Lista las especializaciones para el combo.
   * @returns lista de especializaciones.
   */
  listarEspecializaciones(): Observable<Especializacion[]> {
    return this.backendService.get(environment.apiUrlAuth, 'especializacion', 'listar');
  }
}
