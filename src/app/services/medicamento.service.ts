import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { Medicamento } from 'src/app/models/medicamentos';

@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {

  private api = 'medicamento';

  constructor(
    private readonly backendService: BackendService
  ) {}

  listar(): Observable<Medicamento[]> {
    return this.backendService.get<Medicamento[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }

  crear(
    medicamento: Medicamento
  ): Observable<Medicamento> {

    return this.backendService.post<Medicamento>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      medicamento
    );
  }

  actualizar(
    id: number,
    medicamento: Medicamento
  ): Observable<Medicamento> {

    return this.backendService.put<Medicamento>(
      environment.apiUrlAuth,
      this.api,
      `actualizar/${id}`,
      medicamento
    );
  }
}