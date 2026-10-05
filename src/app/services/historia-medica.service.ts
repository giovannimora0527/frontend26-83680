import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { HistoriaMedica } from 'src/app/models/historia-medica';

@Injectable({
  providedIn: 'root'
})
export class HistoriaMedicaService {

  private api = 'historia-medica';

  constructor(
    private readonly backendService: BackendService
  ) {}

  listar(): Observable<HistoriaMedica[]> {
    return this.backendService.get<HistoriaMedica[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }

  crear(historia: HistoriaMedica): Observable<HistoriaMedica> {
    return this.backendService.post<HistoriaMedica>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      historia
    );
  }

  actualizar(
    id: number,
    historia: HistoriaMedica
  ): Observable<HistoriaMedica> {
    return this.backendService.put<HistoriaMedica>(
      environment.apiUrlAuth,
      this.api,
      `actualizar/${id}`,
      historia
    );
  }
}