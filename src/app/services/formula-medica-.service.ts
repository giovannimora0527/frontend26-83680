import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { FormulaMedica } from 'src/app/models/formula-medica';

@Injectable({
  providedIn: 'root'
})
export class FormulaMedicaService {

  private api = 'formula-medica';

  constructor(
    private readonly backendService: BackendService
  ) {}

  listar(): Observable<FormulaMedica[]> {
    return this.backendService.get<FormulaMedica[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }

  crear(formula: FormulaMedica): Observable<FormulaMedica> {
    return this.backendService.post<FormulaMedica>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      formula
    );
  }

  actualizar(
    id: number,
    formula: FormulaMedica
  ): Observable<FormulaMedica> {
    return this.backendService.put<FormulaMedica>(
      environment.apiUrlAuth,
      this.api,
      `actualizar/${id}`,
      formula
    );
  }
}