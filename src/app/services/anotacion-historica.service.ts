import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { AnotacionHistoria } from 'src/app/models/anotacion-historia';

@Injectable({
  providedIn: 'root'
})
export class AnotacionHistoriaService {

  private api = 'anotacion-historia';

  constructor(
    private readonly backendService: BackendService
  ) {}

  listar(): Observable<AnotacionHistoria[]> {
    return this.backendService.get<AnotacionHistoria[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }

  crear(anotacion: AnotacionHistoria): Observable<AnotacionHistoria> {
    return this.backendService.post<AnotacionHistoria>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      anotacion
    );
  }

  actualizar(
    id: number,
    anotacion: AnotacionHistoria
  ): Observable<AnotacionHistoria> {
    return this.backendService.put<AnotacionHistoria>(
      environment.apiUrlAuth,
      this.api,
      `actualizar/${id}`,
      anotacion
    );
  }
}