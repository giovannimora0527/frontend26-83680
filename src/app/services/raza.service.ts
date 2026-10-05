import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { Raza } from 'src/app/models/raza';

@Injectable({
  providedIn: 'root'
})
export class RazaService {

  private api = 'raza';

  constructor(
    private readonly backendService: BackendService
  ) {}

  listar(): Observable<Raza[]> {
    return this.backendService.get<Raza[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }

  crear(raza: Raza): Observable<Raza> {
    return this.backendService.post<Raza>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      raza
    );
  }

  actualizar(
    razaId: number,
    raza: Raza
  ): Observable<Raza> {
    return this.backendService.put<Raza>(
      environment.apiUrlAuth,
      this.api,
      `actualizar/${razaId}`,
      raza
    );
  }
}