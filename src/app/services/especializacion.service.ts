import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { Especializacion } from 'src/app/models/especializacion';

@Injectable({
  providedIn: 'root'
})
export class EspecializacionService {

  private api = 'especializacion';

  constructor(
    private readonly backendService: BackendService
  ) {}

  listar(): Observable<Especializacion[]> {
    return this.backendService.get<Especializacion[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }

  crear(
    especializacion: Especializacion
  ): Observable<Especializacion> {

    return this.backendService.post<Especializacion>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      especializacion
    );
  }

  actualizar(
    id: number,
    especializacion: Especializacion
  ): Observable<Especializacion> {

    return this.backendService.put<Especializacion>(
      environment.apiUrlAuth,
      this.api,
      `actualizar/${id}`,
      especializacion
    );
  }
}