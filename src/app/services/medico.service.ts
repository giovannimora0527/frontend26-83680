import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { Medico } from 'src/app/models/medico';

@Injectable({
  providedIn: 'root'
})
export class MedicoService {

  private api = 'medico';

  constructor(
    private readonly backendService: BackendService
  ) {}

  listar(): Observable<Medico[]> {
    return this.backendService.get<Medico[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }

  crear(
    medico: Medico
  ): Observable<Medico> {

    return this.backendService.post<Medico>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      medico
    );
  }

  actualizar(
    id: number,
    medico: Medico
  ): Observable<Medico> {

    return this.backendService.put<Medico>(
      environment.apiUrlAuth,
      this.api,
      `actualizar/${id}`,
      medico
    );
  }
}