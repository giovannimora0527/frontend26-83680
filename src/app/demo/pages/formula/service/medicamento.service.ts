import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medicamento } from 'src/app/models/medicamento';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio para consultar los medicamentos.
 */
@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {
  /** Ruta base del backend para los medicamentos. */
  private api = `medicamento`;

  constructor(private readonly backendService: BackendService) { }

  /**
   * Lista los medicamentos para el combo.
   * @returns lista de medicamentos.
   */
  listarMedicamentos(): Observable<Medicamento[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }
}
