import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { Mascota } from 'src/app/models/mascota';

@Injectable({
  providedIn: 'root'
})
export class MascotaService {

  private api = 'mascota';

  constructor(
    private readonly backendService: BackendService
  ) {}

  listar(): Observable<Mascota[]> {
    return this.backendService.get<Mascota[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }

  listarPorCliente(clienteId: number): Observable<Mascota[]> {

    const params = new HttpParams()
      .set('clienteId', clienteId.toString());

    return this.backendService.get<Mascota[]>(
      environment.apiUrlAuth,
      this.api,
      'listar-by-cliente',
      params
    );
  }

  listarPorRaza(razaId: number): Observable<Mascota[]> {

    const params = new HttpParams()
      .set('razaId', razaId.toString());

    return this.backendService.get<Mascota[]>(
      environment.apiUrlAuth,
      this.api,
      'listar-by-raza',
      params
    );
  }

  crear(mascota: Mascota): Observable<Mascota> {

    return this.backendService.post<Mascota>(
      environment.apiUrlAuth,
      this.api,
      'crear',
      mascota
    );
  }

  actualizar(
    mascotaId: number,
    mascota: Mascota
  ): Observable<Mascota> {

    return this.backendService.put<Mascota>(
      environment.apiUrlAuth,
      this.api,
      `actualizar/${mascotaId}`,
      mascota
    );
  }
}