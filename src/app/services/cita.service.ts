import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { Cita } from 'src/app/models/cita';

@Injectable({
  providedIn: 'root'
})
export class CitaService {

  private api = 'cita';

  constructor(
    private readonly backendService: BackendService
  ) {}

  listar(): Observable<Cita[]> {
    return this.backendService.get<Cita[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }

  listarPorRango(
    fechaInicial: string,
    fechaFinal: string
  ): Observable<Cita[]> {

    const params = new HttpParams()
      .set('fechaInicial', fechaInicial)
      .set('fechaFinal', fechaFinal);

    return this.backendService.get<Cita[]>(
      environment.apiUrlAuth,
      this.api,
      'listar-por-rango',
      params
    );
  }

  listarPorMedico(
    medicoId: number,
    fechaInicial: string,
    fechaFinal: string
  ): Observable<Cita[]> {

    const params = new HttpParams()
      .set('medicoId', medicoId.toString())
      .set('fechaInicial', fechaInicial)
      .set('fechaFinal', fechaFinal);

    return this.backendService.get<Cita[]>(
      environment.apiUrlAuth,
      this.api,
      'listar-por-medico',
      params
    );
  }

  crear(cita: Cita): Observable<Cita> {

    return this.backendService.post<Cita>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      cita
    );
  }

  actualizar(
    id: number,
    cita: Cita
  ): Observable<Cita> {

    return this.backendService.put<Cita>(
      environment.apiUrlAuth,
      this.api,
      `actualizar/${id}`,
      cita
    );
  }
}